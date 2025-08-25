import graphene
import graphql_jwt
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model, authenticate
from graphql_jwt.shortcuts import get_token
from graphql_jwt.shortcuts import create_refresh_token
from accounts.models import Organization

User = get_user_model()


class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email")


class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "email", "username", "organization", "is_active")


class ObtainJSONWebTokenWithEmail(graphene.Mutation):
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)

    token = graphene.String()
    refresh_token = graphene.String()
    user = graphene.Field(UserType)

    @classmethod
    def mutate(cls, root, info, email, password):
        user = authenticate(info.context, email=email, password=password)
        if user is None:
            raise Exception("Invalid email or password")
        if not user.is_active:
            raise Exception("User account is disabled")

        token = get_token(user)
        # With long-running refresh tokens app installed, this returns a model instance
        refresh = create_refresh_token(user)
        refresh_token = str(getattr(refresh, "token", None) or refresh)

        return cls(user=user, token=token, refresh_token=refresh_token)


# Query
class AccountsQuery(graphene.ObjectType):
    me = graphene.Field(UserType)

    def resolve_me(root, info):
        user = info.context.user
        if user.is_anonymous:
            return None
        return User.objects.select_related('organization').get(pk=user.pk)


# Mutation
class AccountsMutation(graphene.ObjectType):
    token_auth = ObtainJSONWebTokenWithEmail.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
