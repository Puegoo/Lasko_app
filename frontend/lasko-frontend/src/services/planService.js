// Prosty PlanService używający lokalnego algorytmu
class PlanService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async generateAIPlan(userData, surveyData) {
    console.log('🤖 Lokalny algorytm planService');
    return this.generateLocalFallbackPlan(userData, surveyData);
  }

  generateLocalFallbackPlan(userData, surveyData) {
    const days = surveyData.trainingDaysPerWeek || 3;
    const weekPlan = [];
    
    const exercises = [
      { name: 'Pompki', sets: '3', reps: '10-12', rest: 60, muscle: 'Klatka' },
      { name: 'Przysiady', sets: '3', reps: '15-20', rest: 60, muscle: 'Nogi' },
      { name: 'Plank', sets: '3', reps: '30s', rest: 45, muscle: 'Core' }
    ];
    
    for (let day = 1; day <= days; day++) {
      weekPlan.push({
        day,
        name: `Dzień ${day}`,
        exercises: exercises.map(ex => ({
          ...ex,
          difficulty: 'medium',
          priority: 1
        })),
        estimatedDuration: surveyData.sessionDuration || 60,
        targetMuscles: exercises.map(ex => ex.muscle)
      });
    }
    
    return {
      weekPlan,
      generatedExercises: weekPlan.flatMap(day => day.exercises),
      aiInsights: {
        score: 75,
        whyRecommended: ['Lokalny algorytm'],
        warnings: ['Plan lokalny'],
        estimatedDuration: surveyData.sessionDuration || 60,
        isFallback: true
      },
      algorithmMetadata: {
        version: '1.0-local',
        isFromDatabase: false,
        isFallback: true
      },
      alternatives: []
    };
  }
}

export default PlanService;
