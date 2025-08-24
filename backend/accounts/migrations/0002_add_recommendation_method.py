# backend/accounts/migrations/0002_add_recommendation_method.py
# Plik migracji do dodania pola recommendation_method

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='recommendation_method',
            field=models.CharField(
                blank=True,
                choices=[
                    ('product', 'Na podstawie produktu'),
                    ('user', 'Na podstawie klienta'), 
                    ('hybrid', 'Hybrydowo')
                ],
                max_length=20,
                null=True
            ),
        ),
    ]