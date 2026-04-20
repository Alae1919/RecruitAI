from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interviews', '0003_answer_score'),
    ]

    operations = [
        migrations.AlterField(
            model_name='interview',
            name='status',
            field=models.CharField(
                choices=[
                    ('available', 'Available'),
                    ('scheduled', 'Scheduled'),
                    ('completed', 'Completed'),
                    ('canceled', 'Canceled'),
                ],
                default='available',
                max_length=16,
            ),
        ),
        migrations.AlterField(
            model_name='interview',
            name='interview_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
