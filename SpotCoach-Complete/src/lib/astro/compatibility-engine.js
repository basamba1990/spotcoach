import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class CompatibilityEngine {
  static async findComplementaryMatches(userId, limit = 5) {
    try {
      // 1. Récupérer le profil symbolique de l'utilisateur
      const { data: userProfile, error } = await supabase
        .from('profiles_symboliques')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !userProfile) {
        throw new Error('Profil utilisateur non trouvé');
      }

      // 2. Récupérer les autres profils
      const { data: otherProfiles, error: othersError } = await supabase
        .from('profiles_symboliques')
        .select('*')
        .neq('user_id', userId)
        .limit(20);

      if (othersError) {
        throw othersError;
      }

      // 3. Calculer les compatibilités
      const matches = otherProfiles.map(profile => ({
        profile,
        compatibility: this.calculateCompatibility(userProfile, profile)
      }));

      // 4. Trier par score de compatibilité
      matches.sort((a, b) => b.compatibility.score - a.compatibility.score);

      return matches.slice(0, limit);
    } catch (error) {
      console.error('Erreur matching:', error);
      return [];
    }
  }

  static calculateCompatibility(profile1, profile2) {
    let score = 0;
    const reasons = [];

    // Compatibilité des éléments
    const elementCompatibility = this.getElementCompatibility(profile1.élément, profile2.élément);
    score += elementCompatibility.score;
    reasons.push(...elementCompatibility.reasons);

    // Compatibilité des archétypes
    const archtypeCompatibility = this.getArchtypeCompatibility(profile1.archétype, profile2.archétype);
    score += archtypeCompatibility.score;
    reasons.push(...archtypeCompatibility.reasons);

    // Compatibilité des couleurs
    const colorCompatibility = this.getColorCompatibility(profile1.couleur_dominante, profile2.couleur_dominante);
    score += colorCompatibility.score;
    reasons.push(...colorCompatibility.reasons);

    return {
      score: Math.min(score, 10),
      reasons: reasons.slice(0, 3),
      connectionType: this.getConnectionType(score)
    };
  }

  static getElementCompatibility(element1, element2) {
    const compatiblePairs = {
      'Feu': ['Air', 'Feu'],
      'Terre': ['Eau', 'Terre'], 
      'Air': ['Feu', 'Air'],
      'Eau': ['Terre', 'Eau']
    };

    const score = compatiblePairs[element1]?.includes(element2) ? 3 : 1;
    const reason = score === 3 ? 
      `Synergie ${element1}-${element2} : énergies complémentaires` :
      `Éléments ${element1}-${element2} : défi créatif`;

    return { score, reasons: [reason] };
  }

  static getArchtypeCompatibility(arch1, arch2) {
    const synergisticPairs = {
      'Héros': ['Mentor', 'Allié'],
      'Nourricier': ['Explorateur', 'Créateur'],
      'Messager': ['Sage', 'Guerrier'],
      'Amoureux': ['Artiste', 'Roi'],
      'Guerrier': ['Diplomate', 'Stratège']
    };

    const score = synergisticPairs[arch1]?.includes(arch2) ? 4 : 2;
    const reason = `Archétypes ${arch1} et ${arch2} : ${score === 4 ? 'complémentarité forte' : 'dynamique intéressante'}`;

    return { score, reasons: [reason] };
  }

  static getColorCompatibility(color1, color2) {
    const harmoniousPairs = {
      'Rouge': ['Or', 'Bleu'],
      'Bleu': ['Argent', 'Vert'],
      'Vert': ['Violet', 'Orange'],
      'Jaune': ['Turquoise', 'Rose']
    };

    const score = harmoniousPairs[color1]?.includes(color2) ? 2 : 1;
    return { score, reasons: [`Couleurs ${color1} et ${color2} en harmonie`] };
  }

  static getConnectionType(score) {
    if (score >= 8) return 'synergie_exceptionnelle';
    if (score >= 6) return 'complémentarité_forte';
    if (score >= 4) return 'partenariat_potentiel';
    return 'rencontre_intéressante';
  }
}
