import graphene
from project_management.schema.queries import ProjectQuery, TaskQuery
from project_management.schema.mutations import ProjectMutation, TaskMutation


class Query(ProjectQuery, TaskQuery, graphene.ObjectType):
    pass


class Mutation(ProjectMutation, TaskMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
