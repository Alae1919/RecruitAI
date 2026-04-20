from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('interviews', '0004_interview_status_textchoices_date_nullable'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='interview',
            index=models.Index(fields=['status'], name='interview_status_idx'),
        ),
    ]
