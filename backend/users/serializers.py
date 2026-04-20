from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

from rest_framework.exceptions import AuthenticationFailed

from django.contrib.auth.hashers import make_password, check_password
from .models import User, JobSeeker, Recruiter,  UserRole,Role
import logging

logger = logging.getLogger(__name__)

_RESUME_MAGIC = {
    'pdf':  b'%PDF',
    'docx': b'PK\x03\x04',
    'doc':  b'\xd0\xcf\x11\xe0',
}

def _validate_resume_file(value):
    if value.size > 3 * 1024 * 1024:
        raise serializers.ValidationError("The file size exceeds the limit of 3MB.")
    ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
    if ext not in _RESUME_MAGIC:
        raise serializers.ValidationError("Only .pdf, .doc, or .docx files are allowed.")
    header = value.read(8)
    value.seek(0)
    if not header.startswith(_RESUME_MAGIC[ext]):
        raise serializers.ValidationError("File content does not match the declared file type.")
    return value

class UniqueEmailForRoleValidator:
    """
    UniqueValidator personnalisé pour exclure un rôle spécifique (par exemple, "RECRUITER").
    """
    def __init__(self, queryset, exclude_roles=None):
        self.queryset = queryset
        self.exclude_roles = exclude_roles or []

    def __call__(self, value):
        # Recherche d'un utilisateur avec le même email mais exclut ceux avec le rôle spécifié
        existing_user = self.queryset.filter(email=value).first()
        if existing_user:
            # Si un utilisateur existe et a un rôle différent, on autorise la création
            user_roles = UserRole.objects.filter(user=existing_user)
            for role in user_roles:
                if role.role.role_name not in self.exclude_roles:
                    raise serializers.ValidationError(f"This email is already registered as a {role.role.role_name}.")
        return value

#############################################################################################################

#############################################################################################################

#############################################################################################################

class JobSeekerSignupSerializer(serializers.ModelSerializer):

    # Champs supplémentaires pour l'utilisateur
    full_name = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=True)
    address = serializers.CharField(write_only=True, required=True)
    
    # Champs spécifiques à JobSeeker
    experience = serializers.CharField(write_only=True, required=True)
    skills = serializers.CharField(write_only=True, required=True)
    resume = serializers.FileField(write_only=True, required=True)

    # Désactiver la validation d'unicité automatique sur le champ email
    email = serializers.EmailField(
        required=True,
        validators=[UniqueEmailForRoleValidator(queryset=User.objects.all(), exclude_roles=["RECRUITER", "JOBSEEKER"])]
    )

    class Meta:
        model = User
        fields = [
            'email', 'password', 'full_name', 'phone', 'address',
            'experience', 'skills', 'resume'
        ]

    def validate(self, data):
        """
        Validation personnalisée des données.
        """
        logger.info("Début de la validation des données dans validate()")

        email=data['email']
        password=data.get('password', '')

        logger.debug(f"Email: {email}, Password Length: {len(password)}")

        # Vérifie la longueur du mot de passe
        if len(password) < 8:
            logger.warning("Le mot de passe est trop court")
            raise serializers.ValidationError({
                'password': "Password must be at least 8 characters long."
            })

       
        if User.objects.filter(email=data['email']).exists():
            logger.info("Utilisateur existant trouvé avec cet email")
            existing_user = User.objects.get(email=data['email'])

            # Vérifier si le rôle "Recruiter" est déjà associé à cet utilisateur
            jobSeeker = Role.objects.filter(role_name="JOBSEEKER").first()
            if jobSeeker and UserRole.objects.filter(user=existing_user, role=jobSeeker).exists():
                logger.error("Email déjà enregistré en tant que JobSeeker")
                raise serializers.ValidationError({
                    'email': "This email is already registered as a JOBSEEKER."
                })

                    # Vérifier si le mot de passe correspond
            if not check_password(password, existing_user.password):
                logger.error("Le mot de passe ne correspond pas à l'utilisateur existant")
                raise serializers.ValidationError({
                    'password': "Password does not match the existing account."
                })
        logger.info("Validation terminée avec succès")
        return data

    def validate_resume(self, value):
        return _validate_resume_file(value)

    def create(self, validated_data):
        """
        Création de l'utilisateur et du JobSeeker.
        """
        logger.info("Début create")
        # Extraire les données nécessaires
        full_name = validated_data.pop('full_name')
        experience = validated_data.pop('experience')
        skills = validated_data.pop('skills')
        resume = validated_data.pop('resume')

        # Diviser le nom complet en prénom et nom
        first_name, last_name = '', ''
        if ' ' in full_name:
            first_name, last_name = full_name.split(' ', 1)
        else:
            first_name = full_name
        logger.info("get validating email")
        email = validated_data['email']
        logger.info("get validating email validated")
         # verifier si l'utilisateur existe ou Créer l'utilisateur
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            logger.info("user with existing eamil in create")
        else:
            logger.info("no user with existing eamil in create")
            # Créer l'utilisateur
            user = User.objects.create(
                username=validated_data['email'],
                email=validated_data['email'],
                password=make_password(validated_data['password']),
                first_name=first_name,
                last_name=last_name,
                phone=validated_data['phone'],
                address=validated_data['address']
            )

        logger.info("debut jobseeker create")
        # Créer l'objet JobSeeker
        JobSeeker.objects.create(
            user=user,
            experience=experience,
            skills=skills,
            resume=resume
        )
        logger.info("fin jobseeker create")   
        # Ensure the Role exists, or create it if not
        logger.info("debut get role")
        rol, created = Role.objects.get_or_create(
            role_name="JOBSEEKER"
        )        
        logger.info("debut userRole create")
        UserRole.objects.create(
            user=user,
            role=rol
        )
       

        return user

#############################################################################################################


#############################################################################################################


#############################################################################################################


#############################################################################################################

class RecruiterSignupSerializer(serializers.ModelSerializer):
    # Champs supplémentaires pour l'utilisateur
    full_name = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=True)
    address = serializers.CharField(write_only=True, required=False)
    
    # Champs spécifiques à Recruiter
    company_name = serializers.CharField(write_only=True, required=True)
    company_phone = serializers.CharField(write_only=True, required=True)
    position = serializers.CharField(write_only=True, required=False)

   
    company_website = serializers.CharField(write_only=True, required=True)
    industry = serializers.CharField(write_only=True, required=True)
    
    # Désactiver la validation d'unicité automatique sur le champ email
    email = serializers.EmailField(
        required=True,
        validators=[UniqueEmailForRoleValidator(queryset=User.objects.all(), exclude_roles=["RECRUITER", "JOBSEEKER"])]
    )


    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'full_name', 'phone', 'address',
            'company_name', 'company_phone', 'position','industry','company_website',
        ]
        extra_kwargs = {
            'address': {'required': False, 'allow_blank': True},  # Adresse optionnelle
            'position': {'required': False, 'allow_blank': True},
            'industry':{'required': False, 'allow_blank': True},
            'company_website':{'required': False, 'allow_blank': True},  # Position optionnelle
        }
        
        unique_together = ('email', 'role')

    #############################################################################################################

    def validate(self, data):
        """
        Validation personnalisée des données.
        """

        logger.info("Début validate serial recruiter")
        email=data.get('email')
        password=data.get('password', '')

        if len(password) < 8:
            raise serializers.ValidationError({
                'password': "Password must be at least 8 characters long."
            })

        if User.objects.filter(email=data['email']).exists():
            logger.debug("user email existing, in validate serializer recruiter ")
            existing_user = User.objects.get(email=email)

            # Vérifier si le rôle "Recruiter" est déjà associé à cet utilisateur
            recruiter_role = Role.objects.filter(role_name="RECRUITER").first()
            if recruiter_role and UserRole.objects.filter(user=existing_user, role=recruiter_role).exists():
                raise serializers.ValidationError({
                    'email': "This email is already registered as a recruiter."
                })

            # Vérifier si le mot de passe correspond
            if not check_password(password, existing_user.password):
                raise serializers.ValidationError({
                    'password': "Password does not match the existing account."
                })
          
        return data
#############################################################################################################
    def create(self, validated_data):
        """
        Création de l'utilisateur et du Recruiter.
        """
        logger.debug("debut create recruiter ")
        

        # Extraire les données nécessaires
        full_name = validated_data.pop('full_name')
        company_name = validated_data.pop('company_name')
        company_phone = validated_data.pop('company_phone')
        position = validated_data.pop('position',None)
        address = validated_data.pop('address',None)
        company_website = validated_data.pop('company_website',None)
        industry = validated_data.pop('industry',None)

        # Diviser le nom complet en prénom et nom
        first_name, last_name = '', ''
        if ' ' in full_name:
            first_name, last_name = full_name.split(' ', 1)
        else:
            first_name = full_name

        # # Vérifier si l'utilisateur existe déjà ou Créer l'utilisateur 
        email = validated_data['email']
        logger.debug("checking existing email in create recruiter ")
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            logger.debug("user email existing, in create serializer recruiter ")
        else:
            user = User.objects.create(
                username=validated_data['email'],
                email=validated_data['email'],
                password=make_password(validated_data['password']),
                first_name=first_name,
                last_name=last_name,
                phone=validated_data['phone'],
                address=address
            )
        logger.debug("debut create recruiter object ")
        # Créer l'objet Recruiter
        Recruiter.objects.create(
            user=user,
            company_name=company_name,
            company_phone=company_phone,
            position=position,
            industry=industry,
            company_website=company_website

        )

        rol, created = Role.objects.get_or_create(
            role_name="RECRUITER"
        )   
        if not UserRole.objects.filter(user=user, role=rol).exists():     
            UserRole.objects.create(
                user=user,
                role=rol
            )

        return user

#############################################################################################################


#############################################################################################################


#############################################################################################################


#############################################################################################################

class LoginSpecialSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=['JOBSEEKER', 'RECRUITER'],required=True)

    class Meta:
        model=User
        fields = [
            'email', 'password',
            'role'
        ]

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        # Ensure role is provided
        if not role:
            raise AuthenticationFailed("Role is required.")

        # Authentifier l'utilisateur
        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError("Email ou mot de passe incorrect.")

        recruiter_role = Role.objects.filter(role_name=role).first()
        if not UserRole.objects.filter(user=user, role=recruiter_role).exists():
            raise serializers.ValidationError(f"L'utilisateur n'est pas enregistré en tant que {role}.")



        #if not user.is_active:
         #   raise serializers.ValidationError("Ce compte est désactivé.")

       

        data['user'] = user
        return data
    
#############################################################################################################


#############################################################################################################


#############################################################################################################


#############################################################################################################




class RecruiterProfileUpdateSerializer(serializers.Serializer):
    # Fields for User
    full_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    personal_phone = serializers.CharField(required=False)
    address = serializers.CharField(required=False)

    # Fields for Recruiter
    company_name = serializers.CharField(required=False)
    company_phone = serializers.CharField(required=False)
    position = serializers.CharField(required=False)
    company_website = serializers.URLField(required=False)
    industry = serializers.CharField(required=False)

    def validate_email(self, value):
        """
        Ensure email is unique if it's being updated.
        """
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate(self, data):
        """
        Add custom validation if necessary.
        """
        if 'personal_phone' in data and not data['personal_phone'].isdigit():
            raise serializers.ValidationError({"personal_phone": "Personal phone must contain only digits."})
        if 'company_phone' in data and not data['company_phone'].isdigit():
            raise serializers.ValidationError({"company_phone": "Company phone must contain only digits."})
        return data

    def update(self, instance, validated_data):
        """
        Update the User and Recruiter models.
        """
        user = instance.user  # Get the related User instance

        # Update User fields
        full_name = validated_data.pop('full_name', None)
        if full_name:
            if ' ' in full_name:
                user.first_name, user.last_name = full_name.split(' ', 1)
            else:
                user.first_name = full_name
                user.last_name = ""
        user.email = validated_data.get('email', user.email)
        user.phone = validated_data.get('personal_phone', user.phone)
        user.address = validated_data.get('address', user.address)
        user.save()

        # Update Recruiter fields
        instance.company_name = validated_data.get('company_name', instance.company_name)
        instance.company_phone = validated_data.get('company_phone', instance.company_phone)
        instance.position = validated_data.get('position', instance.position)
        instance.company_website = validated_data.get('company_website', instance.company_website)
        instance.industry = validated_data.get('industry', instance.industry)
        instance.save()

        return instance


#############################################################################################################


#############################################################################################################


#############################################################################################################


#############################################################################################################



class RecruiterProfileSerializer(serializers.ModelSerializer):
    # Nested serializer for user information
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    personal_phone = serializers.CharField(source="user.phone")
    address = serializers.CharField(source="user.address")
    
    class Meta:
        model = Recruiter
        fields = [
            'full_name', 'email', 'personal_phone', 'address',
            'company_name', 'company_phone', 'position', 
            'company_website', 'industry'
        ]

    def get_full_name(self, obj):
        """
        Combine first and last names to create a full name.
        """
        user = obj.user
        return f"{user.first_name} {user.last_name}".strip()
#############################################################################################################


#############################################################################################################


#############################################################################################################

class JobSeekerProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(source="user.phone")
    address = serializers.CharField(source="user.address")

    class Meta:
        model = JobSeeker
        fields = [
            'full_name', 'email', 'phone', 'address',
            'experience', 'skills', 'resume'
        ]

    def get_full_name(self, obj):
        """
        Combine les prénoms et noms de l'utilisateur pour le champ full_name.
        """
        user = obj.user
        return f"{user.first_name} {user.last_name}".strip()
#############################################################################################################
class JobSeekerProfileUpdateSerializer(serializers.Serializer):
    # Fields for User
    full_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    personal_phone = serializers.CharField(required=False)
    address = serializers.CharField(required=False)

    # Fields for Job Seeker
    resume = serializers.FileField(write_only=True, required=True)  # URL du CV
    #linkedin_profile = serializers.URLField(required=False)
    skills=serializers.CharField(required=False)
    #skills = serializers.ListField( child=serializers.CharField(), required=False )  # Liste des compétences
    experience = serializers.CharField(required=False)
    #current_position = serializers.CharField(required=False)

    def validate_email(self, value):
        """
        Assure que l'email est unique s'il est mis à jour.
        """
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_resume(self, value):
        return _validate_resume_file(value)

    def validate(self, data):
        """
        Ajout de validations personnalisées si nécessaire.
        """
        if 'personal_phone' in data and not data['personal_phone'].isdigit():
            raise serializers.ValidationError({"personal_phone": "Personal phone must contain only digits."})
        #if 'experience' in data and data['experience'] < 0:
         #   raise serializers.ValidationError({"experience_years": "Experience years must be a positive number."})
        return data

    def update(self, instance, validated_data):
        """
        Met à jour les modèles User et Job Seeker.
        """
        user = instance.user  # Récupère l'instance liée de User

        # Mise à jour des champs User
        full_name = validated_data.pop('full_name', None)
        if full_name:
            if ' ' in full_name:
                user.first_name, user.last_name = full_name.split(' ', 1)
            else:
                user.first_name = full_name
                user.last_name = ""
        user.email = validated_data.get('email', user.email)
        user.phone = validated_data.get('personal_phone', user.phone)
        user.address = validated_data.get('address', user.address)
        user.save()

        # Mise à jour des champs Job Seeker
        instance.resume = validated_data.get('resume', instance.resume)
        #instance.linkedin_profile = validated_data.get('linkedin_profile', instance.linkedin_profile)
        instance.skills = validated_data.get('skills', instance.skills)
        instance.experience = validated_data.get('experience', instance.experience)
        #instance.current_position = validated_data.get('current_position', instance.current_position)
        instance.save()

        return instance