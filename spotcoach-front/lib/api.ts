// lib/api.ts
class SpotBulleAPI {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'
  }

  async getMatches(): Promise<Match[]> {
    const response = await fetch(`${this.baseURL}/matches`, {
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`
      }
    })
    
    if (!response.ok) throw new Error('Failed to fetch matches')
    return response.json()
  }

  async generateProjects(partnerId: string): Promise<{ projects: CollaborativeProject[] }> {
    const response = await fetch(`${this.baseURL}/projects/${partnerId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error('Failed to generate projects')
    return response.json()
  }

  async saveProjectInterest(projectId: string, interestLevel: number, feedback?: string) {
    const response = await fetch(`${this.baseURL}/projects/interest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectId, interestLevel, feedback })
    })
    
    if (!response.ok) throw new Error('Failed to save interest')
    return response.json()
  }

  private async getToken(): Promise<string> {
    // Implémentation de récupération du token JWT
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  }
}

export const api = new SpotBulleAPI()
