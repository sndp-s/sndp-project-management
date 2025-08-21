import graphene


class Query(graphene.ObjectType):
    hello = graphene.String(description="Hello World!")

    def resolve_hello(root, info):
        return "Hello, world!"


schema = graphene.Schema(query=Query)
