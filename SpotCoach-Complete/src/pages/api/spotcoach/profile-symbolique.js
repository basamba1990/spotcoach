import { EphemeridesCalculator } from '../../../../lib/astro/ephemerides';
import { CompatibilityEngine } from '../../../../lib/astro/compatibility-engine';
import symbols from '../../../../lib/astro/symbols.json';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { date, time, lat, lon, name, userId, userPassions = [] } = req.body;

  if (!date || !time || !lat || !lon || !name) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    console.log('🎯 Calcul profil symbolique avec Swiss Ephemeris');

    // 1. Calculs astronomiques précis
    const positions = await EphemeridesCalculator.getPlanetaryPositions(date, time, lat, lon);
    
    const soleilData = {
      sign: positions.soleil.sign,
      element: positions.soleil.element,
      degree: positions.soleil.degree,
      ...EphemeridesCalculator.getPlanetaryArchtype({ 
        planet: 'soleil', 
        element: positions.soleil.element 
      })
    };

    const luneData = {
      sign: positions.lune.sign,
      element: positions.lune.element,
      degree: positions.lune.degree,
      ...EphemeridesCalculator.getPlanetaryArchtype({ 
        planet: 'lune', 
        element: positions.lune.element 
      })
    };

    const ascendantData = {
      sign: positions.ascendant.sign,
      element: positions.ascendant.element,
      ...symbols.éléments[positions.ascendant.element]
    };

    // 2. Récupération des passions utilisateur depuis le profil existant
    let userPassionsData = userPassions;
    if (!userPassions.length && userId) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('passions')
        .eq('id', userId)
        .single();
      
      userPassionsData = userProfile?.passions || ['expression', 'créativité'];
    }

    // 3. Génération du profil enrichi avec GPT-4
    const prompt = `
En tant que SpotCoach, expert en développement personnel symbolique, crée un profil profondément personnalisé pour ${name}.

DONNÉES PRÉCISES (Swiss Ephemeris) :
- SOLEIL : ${soleilData.sign} (${soleilData.element}) - Degré ${soleilData.degree.toFixed(1)}°
  Archétype: ${soleilData.archétype} | Couleur: ${soleilData.couleur}
  ${soleilData.description}

- LUNE : ${luneData.sign} - Élément ${luneData.element}
  Archétype: ${luneData.archétype} | Couleur: ${luneData.couleur}  
  ${luneData.description}

- ASCENDANT : ${ascendantData.sign} - ${ascendantData.element}
  Style: ${ascendantData.archétype} | Couleur: ${ascendantData.couleur}

PASSIONS DE ${name} : ${userPassionsData.join(', ')}

Génère un profil en 6 parties :

1. **IDENTITÉ RADIANTE** (Soleil)
   Ton essence unique, ton super-pouvoir naturel

2. **MONDE ÉMOTIONNEL** (Lune)  
   Tes besoins profonds et ton langage émotionnel

3. **MASQUE SOCIAL** (Ascendant)
   Comment tu te présentes naturellement au monde

4. **MISSION D'ÂME** (Synthèse)
   Ce que tu es venu expérimenter et partager

5. **ALLIAGES CRÉATIFS** (Passions + Archétypes)
   Comment tes passions s'expriment à travers ton archétype

6. **PHRASE DE SYNCHRONIE**
   "Tu rayonnes quand..." - Relie ton geste technique à ton essence

Ton : Profondément bienveillant, poétique mais concret, inspirant sans être ésotérique.
Intègre des métaphores modernes et des références à ses passions.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Tu es SpotCoach, un guide sagace qui aide les jeunes à découvrir leur magie intérieure. Tu mélanges psychologie des archétypes, intelligence symbolique et compréhension des passions humaines. Ton langage est poétique mais concret, inspirant mais ancré. Tu évites le jargon technique.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const profileText = completion.choices[0].message.content;

    // 4. Extraction de la phrase de synchronie
    const synchronieMatch = profileText.match(/Tu rayonnes quand[^\.]+\./);
    const phraseSynchronie = synchronieMatch ? synchronieMatch[0] : "Tu rayonnes quand ton geste technique rencontre ton essence authentique.";

    // 5. Calcul des compatibilités
    const compatibleMatches = userId ? 
      await CompatibilityEngine.findComplementaryMatches(userId) : [];

    // 6. Sauvegarde dans Supabase
    const { data, error } = await supabase
      .from('profiles_symboliques')
      .insert([
        {
          user_id: userId,
          name,
          date,
          time,
          lat,
          lon,
          soleil: positions.soleil.longitude,
          lune: positions.lune.longitude,
          ascendant: positions.ascendant.longitude,
          profile_text: profileText,
          phrase_synchronie: phraseSynchronie,
          archétype: soleilData.archétype,
          couleur_dominante: soleilData.couleur,
          élément: soleilData.element,
          signe_soleil: soleilData.sign,
          signe_lune: luneData.sign,
          signe_ascendant: ascendantData.sign,
          passions: userPassionsData
        }
      ])
      .select();

    if (error) {
      console.error('Erreur Supabase:', error);
    }

    // 7. Réponse enrichie
    res.status(200).json({
      success: true,
      name,
      profile: profileText,
      phrase_synchronie,
      archétype: soleilData.archétype,
      couleur: soleilData.couleur,
      élément: soleilData.element,
      signs: {
        soleil: soleilData.sign,
        lune: luneData.sign,
        ascendant: ascendantData.sign
      },
      compatible_matches: compatibleMatches,
      saved: !!data,
      calculated_with: "Swiss Ephemeris"
    });

  } catch (error) {
    console.error('Erreur générale:', error);
    res.status(500).json({ 
      error: 'Erreur lors du calcul du profil',
      details: error.message 
    });
  }
}
