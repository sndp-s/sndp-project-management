import graphene
from graphene_django import DjangoObjectType
from project_management.models import Project, Task, TaskComment


class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = ("id", "name", "description", "tasks", "status")

    tasks = graphene.List(lambda: TaskType)

    def resolve_tasks(self, info):
        return self.tasks.all()


class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = ("id", "title", "description", "status", "assignee",
                  "due_date", "created_at", "comments", "project")

    comments = graphene.List(lambda: TaskCommentType)
    project = graphene.Field(lambda: ProjectType)

    def resolve_comments(self, info):
        return self.comments.all()


class TaskCommentType(DjangoObjectType):
    class Meta:
        model = TaskComment
        fields = ("id", "content", "author",
                  "created_at", "task")

    task = graphene.Field(lambda: TaskType)


class ProjectStatsType(graphene.ObjectType):
    total_tasks = graphene.Int()
    completed_tasks = graphene.Int()
    completion_rate = graphene.Float()
