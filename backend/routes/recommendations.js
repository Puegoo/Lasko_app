// backend/routes/recommendations.js
const express = require('express');
const router = express.Router();
const RecommendationService = require('../services/recommendationService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/recommendations/generate-plan
 * Główny endpoint generowania planu AI
 */
router.post('/generate-plan', authenticateToken, async (req, res) => {
  try {
    const { user_profile, survey_data, options = {} } = req.body;
    const userId = req.user.id;
    
    console.log(`🤖 Generowanie planu AI dla użytkownika ${userId}`);
    
    // Walidacja danych wejściowych
    if (!user_profile || !survey_data) {
      return res.status(400).json({
        success: false,
        message: 'Brak wymaganych danych: user_profile i survey_data'
      });
    }

    // Inicjalizuj serwis rekomendacji
    const recommendationService = new RecommendationService(req.db);
    
    // Pobierz profil użytkownika z bazy (jeśli istnieje)
    let userProfile = await getUserProfile(req.db, userId);
    if (!userProfile) {
      // Utwórz tymczasowy profil na podstawie survey_data
      userProfile = {
        auth_account_id: userId,
        goal: survey_data.goal,
        level: survey_data.level,
        training_days_per_week: survey_data.trainingDaysPerWeek,
        equipment_preference: survey_data.equipment,
        ...user_profile
      };
    }

    // Wywołaj algorytm rekomendacyjny
    const recommendations = await recommendationService.recommendPlans(
      userProfile,
      survey_data,
      options.plan_count || 3
    );

    if (recommendations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nie znaleziono planów pasujących do Twoich kryteriów',
        fallback_suggestion: 'Spróbuj zmienić preferencje sprzętu lub liczbę dni treningowych'
      });
    }

    // Pobierz szczegółowe dane dla najlepszego planu
    const bestPlan = recommendations[0];
    const detailedPlan = await getDetailedPlanData(req.db, bestPlan.plan_id);

    // Loguj rekomendację
    await logRecommendation(req.db, userId, bestPlan.plan_id, bestPlan.final_score, survey_data);

    res.json({
      success: true,
      recommendations: [{
        ...bestPlan,
        plan_data: detailedPlan
      }],
      metadata: {
        algorithm_version: '2.1',
        generated_at: new Date().toISOString(),
        user_id: userId,
        survey_hash: hashSurveyData(survey_data)
      }
    });

  } catch (error) {
    console.error('❌ Błąd generowania planu AI:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd wewnętrzny serwera podczas generowania planu',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/recommendations/alternatives
 * Endpoint pobierania alternatywnych planów
 */
router.post('/alternatives', authenticateToken, async (req, res) => {
  try {
    const { user_profile, survey_data, limit = 5 } = req.body;
    const userId = req.user.id;

    const recommendationService = new RecommendationService(req.db);
    let userProfile = await getUserProfile(req.db, userId);
    
    if (!userProfile) {
      userProfile = {
        auth_account_id: userId,
        goal: survey_data.goal,
        level: survey_data.level,
        training_days_per_week: survey_data.trainingDaysPerWeek,
        equipment_preference: survey_data.equipment,
        ...user_profile
      };
    }

    // Pobierz więcej rekomendacji jako alternatywy
    const alternatives = await recommendationService.recommendPlans(
      userProfile,
      survey_data,
      limit
    );

    res.json({
      success: true,
      alternatives: alternatives.map(plan => ({
        plan_id: plan.plan_id,
        name: plan.name,
        description: plan.description,
        final_score: plan.final_score,
        why_recommended: plan.why_recommended.slice(0, 3),
        estimated_duration: plan.estimated_session_duration,
        difficulty: plan.difficulty_level,
        training_days: plan.training_days_per_week
      }))
    });

  } catch (error) {
    console.error('❌ Błąd pobierania alternatyw:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd pobierania alternatywnych planów'
    });
  }
});

/**
 * GET /api/recommendations/explain/:planId
 * Endpoint wyjaśniający dlaczego plan został zarekomendowany
 */
router.get('/explain/:planId', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user.id;

    const recommendationService = new RecommendationService(req.db);
    
    // Pobierz szczegóły planu
    const planDetails = await getDetailedPlanData(req.db, planId);
    if (!planDetails) {
      return res.status(404).json({
        success: false,
        message: 'Plan nie został znaleziony'
      });
    }

    // Pobierz profil użytkownika
    const userProfile = await getUserProfile(req.db, userId);
    if (!userProfile) {
      return res.status(400).json({
        success: false,
        message: 'Profil użytkownika nie został znaleziony'
      });
    }

    // Wygeneruj szczegółowe wyjaśnienie
    const explanation = await generatePlanExplanation(req.db, planDetails, userProfile);

    res.json({
      success: true,
      plan: planDetails,
      explanation,
      user_profile: userProfile
    });

  } catch (error) {
    console.error('❌ Błąd wyjaśnienia planu:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd generowania wyjaśnienia'
    });
  }
});

/**
 * POMOCNICZE FUNKCJE
 */

async function getUserProfile(db, userId) {
  const query = `
    SELECT 
      up.*,
      aa.username,
      aa.email
    FROM user_profiles up
    JOIN auth_accounts aa ON up.auth_account_id = aa.id
    WHERE up.auth_account_id = $1
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
}

async function getDetailedPlanData(db, planId) {
  const query = `
    SELECT 
      tp.*,
      json_agg(
        json_build_object(
          'day_id', pd.id,
          'name', pd.name,
          'day_order', pd.day_order,
          'day_of_week', pd.day_of_week,
          'exercises', day_exercises.exercises,
          'estimated_duration', day_exercises.estimated_duration,
          'target_muscle_groups', day_exercises.muscle_groups
        ) ORDER BY pd.day_order
      ) as days
    FROM training_plans tp
    JOIN plan_days pd ON tp.id = pd.plan_id
    JOIN LATERAL (
      SELECT 
        json_agg(
          json_build_object(
            'id', e.id,
            'name', e.name,
            'muscle_group', e.muscle_group,
            'type', e.type,
            'target_sets', pe.target_sets,
            'target_reps', pe.target_reps,
            'rest_seconds', pe.rest_seconds,
            'superset_group', pe.superset_group,
            'tags', exercise_tags.tags,
            'image_url', e.image_url,
            'video_url', e.video_url
          ) ORDER BY pe.id
        ) as exercises,
        SUM(
          CASE 
            WHEN pe.target_sets ~ '^[0-9]+ THEN 
              pe.target_sets::int * 2 + COALESCE(pe.rest_seconds, 60) / 60.0
            ELSE 3 * 2 + COALESCE(pe.rest_seconds, 60) / 60.0
          END
        ) as estimated_duration,
        array_agg(DISTINCT e.muscle_group) as muscle_groups
      FROM plan_exercises pe
      JOIN exercises e ON pe.exercise_id = e.id
      LEFT JOIN LATERAL (
        SELECT array_agg(t.name) as tags
        FROM exercise_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.exercise_id = e.id
      ) exercise_tags ON true
      WHERE pe.plan_day_id = pd.id
    ) day_exercises ON true
    WHERE tp.id = $1
    GROUP BY tp.id
  `;

  const result = await db.query(query, [planId]);
  return result.rows[0] || null;
}

async function logRecommendation(db, userId, planId, score, surveyData) {
  const query = `
    INSERT INTO recommendation_logs (
      auth_account_id, 
      plan_id, 
      recommendation_score, 
      survey_data, 
      created_at
    ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
  `;

  try {
    await db.query(query, [userId, planId, score, JSON.stringify(surveyData)]);
  } catch (error) {
    console.error('⚠️ Błąd logowania rekomendacji:', error);
    // Nie przerywamy procesu jeśli logowanie się nie uda
  }
}

function hashSurveyData(surveyData) {
  const crypto = require('crypto');
  const dataString = JSON.stringify(surveyData, Object.keys(surveyData).sort());
  return crypto.createHash('md5').update(dataString).digest('hex');
}

async function generatePlanExplanation(db, planDetails, userProfile) {
  const explanation = {
    basic_match: [],
    advanced_match: [],
    potential_issues: [],
    customization_suggestions: []
  };

  // Podstawowe dopasowanie
  if (planDetails.goal_type === userProfile.goal) {
    explanation.basic_match.push(`✅ Cel treningowy: ${planDetails.goal_type}`);
  }
  
  if (planDetails.difficulty_level === userProfile.level) {
    explanation.basic_match.push(`✅ Poziom trudności: ${planDetails.difficulty_level}`);
  }
  
  if (planDetails.training_days_per_week === userProfile.training_days_per_week) {
    explanation.basic_match.push(`✅ Dni treningowe: ${planDetails.training_days_per_week}/tydzień`);
  }

  // Zaawansowane analizy
  const totalExercises = planDetails.days.reduce((sum, day) => sum + day.exercises.length, 0);
  const avgSessionDuration = planDetails.days.reduce((sum, day) => sum + day.estimated_duration, 0) / planDetails.days.length;

  explanation.advanced_match.push(`📊 Łącznie ${totalExercises} ćwiczeń w ${planDetails.days.length} dniach`);
  explanation.advanced_match.push(`⏱️ Średni czas sesji: ~${Math.round(avgSessionDuration)} minut`);

  // Sprawdź potencjalne problemy
  if (avgSessionDuration > 90) {
    explanation.potential_issues.push('⚠️ Długie sesje - może wymagać więcej czasu');
  }

  const complexExercises = planDetails.days.flatMap(day => day.exercises)
    .filter(ex => ex.tags && ex.tags.some(tag => ['olympic', 'advanced', 'complex'].includes(tag.toLowerCase())));
  
  if (complexExercises.length > 0 && userProfile.level === 'początkujący') {
    explanation.potential_issues.push('⚠️ Niektóre ćwiczenia mogą być zbyt zaawansowane');
  }

  // Sugestie dostosowań
  if (userProfile.level === 'początkujący') {
    explanation.customization_suggestions.push('💡 Zacznij od mniejszych obciążeń i skup się na technice');
  }

  if (avgSessionDuration > userProfile.preferred_session_duration + 15) {
    explanation.customization_suggestions.push('💡 Rozważ skrócenie odpoczynków między seriami');
  }

  return explanation;
}

module.exports = router;