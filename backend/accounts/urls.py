# accounts/urls.py
from django.urls import path
from . import views
from . import progress_views
from . import feedback_views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('token/refresh/', views.refresh_token, name='token-refresh'),
    path('profile/', views.profile, name='profile'),
    path('profile/update/', views.update_profile, name='profile-update'),
    path('set-recommendation-method/', views.set_recommendation_method, name='set-reco-method'),
    path('debug-auth/', views.debug_auth, name='debug-auth'),

    # ➜ te dwie linie są kluczowe dla frontu
    path('check-email/', views.check_email, name='check-email'),
    path('check-username/', views.check_username, name='check-username'),
    
    # Harmonogram i powiadomienia
    path('schedule/save/', views.save_schedule, name='save-schedule'),
    path('schedule/get/', views.get_schedule, name='get-schedule'),
]

# Progress tracking URLs (mapped under /api/progress/)
progress_urlpatterns = [
    # Measurements (waga, tkanka tłuszczowa)
    path('measurements/', progress_views.get_measurements, name='get-measurements'),
    path('measurements/add/', progress_views.add_measurement, name='add-measurement'),
    path('measurements/<int:measurement_id>/', progress_views.delete_measurement, name='delete-measurement'),
    path('body-stats/', progress_views.get_body_stats, name='get-body-stats'),
    
    # Personal Records (rekordy osobiste)
    path('personal-records/', progress_views.get_personal_records, name='get-personal-records'),
    path('personal-records/check/', progress_views.check_and_save_pr, name='check-and-save-pr'),
    
    # Progress Metrics (inne metryki)
    path('metrics/', progress_views.get_progress_metrics, name='get-progress-metrics'),
    path('metrics/add/', progress_views.add_progress_metric, name='add-progress-metric'),
    
    # Workout History
    path('workout-history/', progress_views.get_workout_history, name='get-workout-history'),
    path('exercises/<int:exercise_id>/', progress_views.get_exercise_progress, name='get-exercise-progress'),
]

# Feedback URLs (mapped under /api/feedback/)
feedback_urlpatterns = [
    # Plan ratings
    path('rate-plan/', feedback_views.rate_plan, name='rate-plan'),
    path('plan-rating/', feedback_views.get_plan_rating, name='get-plan-rating'),
    path('check-plan-completion/', feedback_views.check_plan_completion, name='check-plan-completion'),
    path('complete-plan/', feedback_views.mark_plan_completed, name='mark-plan-completed'),
    
    # Exercise feedback
    path('exercise/', feedback_views.submit_exercise_feedback, name='submit-exercise-feedback'),
    path('exercise/<int:exercise_id>/', feedback_views.get_exercise_feedback, name='get-exercise-feedback'),
    path('exercises/', feedback_views.get_all_exercise_feedback, name='get-all-exercise-feedback'),
]

# Journal URLs (mapped under /api/journal/)
journal_urlpatterns = [
    path('notes/', feedback_views.get_journal_notes, name='get-journal-notes'),
    path('notes/add/', feedback_views.add_journal_note, name='add-journal-note'),
    path('notes/<int:note_id>/', feedback_views.update_journal_note, name='update-journal-note'),
    path('notes/<int:note_id>/delete/', feedback_views.delete_journal_note, name='delete-journal-note'),
    path('tags/', feedback_views.get_journal_tags, name='get-journal-tags'),
]

# Statistics URLs (mapped under /api/statistics/)
from . import statistics_views

statistics_urlpatterns = [
    path('volume/', statistics_views.get_training_volume, name='get-training-volume'),
    path('muscle-frequency/', statistics_views.get_muscle_group_frequency, name='get-muscle-frequency'),
    path('heatmap/', statistics_views.get_training_heatmap, name='get-training-heatmap'),
    path('general/', statistics_views.get_general_statistics, name='get-general-statistics'),
    path('exercises/', statistics_views.get_exercise_statistics, name='get-exercise-statistics'),
]

# Community URLs (mapped under /api/community/)
from . import community_views

community_urlpatterns = [
    path('similar-users/', community_views.get_similar_users, name='get-similar-users'),
    path('search/', community_views.search_users, name='search-users'),
    path('user/<int:user_id>/', community_views.get_user_profile, name='get-user-profile'),
    path('user/<int:user_id>/stats/', community_views.get_user_statistics, name='get-user-stats'),
    path('user/<int:user_id>/plans/', community_views.get_user_plans, name='get-user-plans'),
]

# Settings URLs (mapped under /api/settings/)
from . import settings_views

settings_urlpatterns = [
    path('', settings_views.get_user_settings, name='get-user-settings'),
    path('profile/', settings_views.update_profile, name='update-profile'),
    path('profile-picture/', settings_views.upload_profile_picture, name='upload-profile-picture'),
    path('change-password/', settings_views.change_password, name='change-password'),
    path('account/', settings_views.delete_account, name='delete-account'),
]

# Calendar URLs (mapped under /api/calendar/)
from . import calendar_views

calendar_urlpatterns = [
    path('', calendar_views.get_calendar_data, name='get-calendar-data'),
    path('session/<int:session_id>/', calendar_views.get_session_details, name='get-session-details'),
]