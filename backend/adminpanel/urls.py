from django.urls import path

from adminpanel import views

urlpatterns = [
    path('dashboard/summary/', views.dashboard_summary, name='admin-dashboard-summary'),
    path('users/', views.list_users, name='admin-users-list'),
    path('users/<int:user_id>/', views.retrieve_user, name='admin-users-detail'),
    path('users/<int:user_id>/status/', views.update_user_status, name='admin-users-status'),
    path('users/<int:user_id>/reset-password/', views.reset_user_password, name='admin-users-reset-password'),
    path('users/export/', views.export_users_csv, name='admin-users-export'),
    path('exercises/', views.exercises_collection, name='admin-exercises-list-create'),
    path('exercises/<int:exercise_id>/', views.exercise_detail, name='admin-exercises-detail'),
    path('exercises/export/', views.export_exercises_csv, name='admin-exercises-export'),
    path('plans/', views.plans_collection, name='admin-plans-list'),
    path('plans/<int:plan_id>/', views.plan_detail, name='admin-plan-detail'),
    path('plans/export/', views.export_plans_csv, name='admin-plans-export'),
    path('recommendations/stats/', views.recommendation_stats, name='admin-recommendations-stats'),
    path('recommendations/logs/', views.recommendation_logs, name='admin-recommendations-logs'),
]
