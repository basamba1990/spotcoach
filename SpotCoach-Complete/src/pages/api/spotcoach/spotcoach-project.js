import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

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

  const { userId, name } = req.body;

  try {
    // 1. Récupération du profil symbolique
    const { data: profile, error } = await supabase
      .from('profiles_symboliques')
      .select('profile_text, phrase_synchronie, archétype, couleur_dominante, passions')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Profil symbolique non trouvé' });
    }

    // 2. Génération du projet avec GPT
    const prompt = `
En tant que SpotCoach, aide ${name} à créer un projet concret basé sur son profil symbolique.

PROFIL SYMBOLIQUE :
${profile.profile_text}

ARCHÉTYPE : ${profile.archétype}
COULEUR ÉNERGÉTIQUE : ${profile.couleur_dominante}
PHRASE DE SYNCHRONIE : ${profile.phrase_synchronie}
PASSIONS : ${profile.passions?.join(', ') || 'créativité, expression'}

Génère une proposition de projet en 4 parties :

1. **Titre du Projet** (créatif et inspirant)
2. **Cause ou Domaine** (écologie, inclusion, éducation, santé, etc.)
3. **Objectif Principal** (concret et mesurable)
4. **Phrase de Motivation** ("Je veux... parce que...")

Le projet doit être :
- Réalisable par un jeune
- En lien avec ses passions (sport, art, expression)
- Porteur de sens pour la communauté
- En accord avec son archétype et sa couleur énergétique

Sois concret, inspirant et propose des idées innovantes.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Tu es SpotCoach, expert en accompagnement de projet pour les jeunes. Tu aides à transformer les insights personnels en actions concrètes qui ont du sens."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const project = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      project,
      archétype: profile.archétype,
      couleur: profile.couleur_dominante
    });

  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du projet',
      details: error.message 
    });
  }
}
