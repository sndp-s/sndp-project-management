import graphene
from graphql_jwt.decorators import login_required
from project_management.models import Project, Task, TaskComment
from project_management.schema.types import ProjectType, TaskType, TaskCommentType, ProjectStatsType
from project_management.helpers import get_project_for_user, get_task_for_user


class ProjectQuery(graphene.ObjectType):
    projects = graphene.List(ProjectType)
    project = graphene.Field(ProjectType, id=graphene.ID(required=True))
    project_stats = graphene.Field(
        ProjectStatsType, project_id=graphene.ID(required=True)
    )

    @login_required
    def resolve_projects(self, info):
        user = info.context.user
        return Project.objects.filter(organization=user.organization)

    @login_required
    def resolve_project(self, info, id):
        return get_project_for_user(info.context.user, id)

    @login_required
    def resolve_project_stats(self, info, project_id):
        project = get_project_for_user(info.context.user, project_id)
        total = project.tasks.count()
        done = project.tasks.filter(status="DONE").count()
        rate = (done / total * 100) if total > 0 else 0
        return ProjectStatsType(
            total_tasks=total,
            completed_tasks=done,
            completion_rate=rate
        )


class TaskQuery(graphene.ObjectType):
    tasks = graphene.List(TaskType, project_id=graphene.ID(required=True))
    task = graphene.Field(TaskType, id=graphene.ID(required=True))
    # task_comments = graphene.List(
    #     TaskCommentType, task_id=graphene.ID(required=True))

    @login_required
    def resolve_tasks(self, info, project_id):
        project = get_project_for_user(info.context.user, project_id)
        return Task.objects.filter(project=project)

    @login_required
    def resolve_task(self, info, id):
        return get_task_for_user(info.context.user, id)

    # @login_required
    # def resolve_task_comments(self, info, task_id):
    #     task = get_task_for_user(info.context.user, task_id)
    #     return TaskComment.objects.filter(task=task)
