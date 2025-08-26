import graphene
from graphql_jwt.decorators import login_required
from project_management.models import Project, Task, TaskComment
from accounts.models import CustomUser
from project_management.schema.types import ProjectType, TaskType, TaskCommentType
from project_management.helpers import get_project_for_user
from datetime import datetime


class CreateProject(graphene.Mutation):
    project = graphene.Field(ProjectType)

    class Arguments:
        name = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()
        dueDate = graphene.String()

    @login_required
    def mutate(self, info, name, description=None, status="ACTIVE", dueDate=None):
        user = info.context.user
        
        # Convert string date to Date object or None
        due_date_obj = None
        if dueDate and dueDate.strip():
            try:
                due_date_obj = datetime.strptime(dueDate, '%Y-%m-%d').date()
            except ValueError:
                raise Exception("Invalid date format. Use YYYY-MM-DD")
        
        project = Project.objects.create(
            name=name,
            description=description or "",
            status=status,
            due_date=due_date_obj,
            organization=user.organization,
        )
        return CreateProject(project=project)


class UpdateProject(graphene.Mutation):
    project = graphene.Field(ProjectType)

    class Arguments:
        id = graphene.ID(required=True)
        name = graphene.String()
        description = graphene.String()
        status = graphene.String()
        dueDate = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        user = info.context.user
        project = get_project_for_user(user, id)
        
        # Handle dueDate conversion
        if 'dueDate' in kwargs:
            dueDate = kwargs.pop('dueDate')
            if dueDate and dueDate.strip():
                try:
                    due_date_obj = datetime.strptime(dueDate, '%Y-%m-%d').date()
                    project.due_date = due_date_obj
                except ValueError:
                    raise Exception("Invalid date format. Use YYYY-MM-DD")
            else:
                project.due_date = None
        
        # Handle other fields
        for key, value in kwargs.items():
            if value is not None:
                setattr(project, key, value)
        
        project.save()
        return UpdateProject(project=project)


class CreateTask(graphene.Mutation):
    task = graphene.Field(TaskType)

    class Arguments:
        projectId = graphene.ID(required=True)
        title = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()
        assigneeEmail = graphene.String()
        dueDate = graphene.String()

    @login_required
    def mutate(self, info, projectId, title, description="", status="TODO", assigneeEmail=None, dueDate=None):
        user = info.context.user
        project = get_project_for_user(user, projectId)

        assignee = None
        if assigneeEmail:
            from accounts.models import CustomUser
            try:
                assignee = CustomUser.objects.get(
                    email=assigneeEmail, organization=user.organization
                )
            except CustomUser.DoesNotExist:
                raise Exception("Assignee not found in your organization")

        # Convert string date to DateTime object or None
        due_date_obj = None
        if dueDate and dueDate.strip():
            try:
                due_date_obj = datetime.strptime(dueDate, '%Y-%m-%d')
            except ValueError:
                raise Exception("Invalid date format. Use YYYY-MM-DD")

        task = Task.objects.create(
            project=project,
            title=title,
            description=description,
            status=status,
            assignee=assignee,
            due_date=due_date_obj,
        )
        return CreateTask(task=task)


class UpdateTask(graphene.Mutation):
    task = graphene.Field(TaskType)

    class Arguments:
        id = graphene.ID(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()
        assigneeEmail = graphene.String()
        dueDate = graphene.String()

    @login_required
    def mutate(self, info, id, **kwargs):
        user = info.context.user
        task = Task.objects.get(pk=id)
        if task.project.organization != user.organization:
            raise Exception("Unauthorized")
        
        # Handle assigneeEmail
        assigneeEmail = kwargs.pop("assigneeEmail", None)
        if assigneeEmail:
            try:
                kwargs["assignee"] = CustomUser.objects.get(
                    email=assigneeEmail, organization=user.organization)
            except CustomUser.DoesNotExist:
                raise Exception("Assignee not found in your organization")
        
        # Handle dueDate conversion
        if 'dueDate' in kwargs:
            dueDate = kwargs.pop('dueDate')
            if dueDate and dueDate.strip():
                try:
                    due_date_obj = datetime.strptime(dueDate, '%Y-%m-%d')
                    task.due_date = due_date_obj
                except ValueError:
                    raise Exception("Invalid date format. Use YYYY-MM-DD")
            else:
                task.due_date = None
        
        # Handle other fields
        for key, value in kwargs.items():
            if value is not None:
                setattr(task, key, value)
        
        task.save()
        return UpdateTask(task=task)


class AddTaskComment(graphene.Mutation):
    comment = graphene.Field(TaskCommentType)

    class Arguments:
        task_id = graphene.ID(required=True)
        content = graphene.String(required=True)

    @login_required
    def mutate(self, info, task_id, content):
        user = info.context.user
        task = Task.objects.get(pk=task_id)
        if task.project.organization != user.organization:
            raise Exception("Unauthorized")
        comment = TaskComment.objects.create(
            task=task,
            content=content,
            author=user,
        )
        return AddTaskComment(comment=comment)


class UpdateTaskComment(graphene.Mutation):
    comment = graphene.Field(TaskCommentType)

    class Arguments:
        id = graphene.ID(required=True)
        content = graphene.String(required=True)

    @login_required
    def mutate(self, info, id, content):
        user = info.context.user
        comment = TaskComment.objects.get(pk=id)
        if comment.task.project.organization != user.organization:
            raise Exception("Unauthorized")
        comment.content = content
        comment.save()
        return UpdateTaskComment(comment=comment)


# Aggregated mutations
class ProjectMutation(graphene.ObjectType):
    create_project = CreateProject.Field()
    update_project = UpdateProject.Field()


class TaskMutation(graphene.ObjectType):
    create_task = CreateTask.Field()
    update_task = UpdateTask.Field()
    add_task_comment = AddTaskComment.Field()
    update_task_comment = UpdateTaskComment.Field()
