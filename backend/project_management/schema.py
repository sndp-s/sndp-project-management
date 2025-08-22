import graphene
from accounts.schema import AccountsQuery, AccountsMutation

class Query(AccountsQuery, graphene.ObjectType):
    pass

class Mutation(AccountsMutation, graphene.ObjectType):
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)
