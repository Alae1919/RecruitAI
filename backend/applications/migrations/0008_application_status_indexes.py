from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0007_application_status_textchoices'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='application',
            index=models.Index(fields=['status'], name='application_status_idx'),
        ),
        migrations.AddIndex(
            model_name='application',
            index=models.Index(fields=['status', 'job_offer'], name='application_status_joboffer_idx'),
        ),
    ]
