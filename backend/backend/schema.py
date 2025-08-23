import graphene
from accounts.schema import AccountsQuery, AccountsMutation
from project_management.schema import Query as PMQuery, Mutation as PMMutation


class Query(AccountsQuery, PMQuery, graphene.ObjectType):
    pass


class Mutation(AccountsMutation, PMMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
