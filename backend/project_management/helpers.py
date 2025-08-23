from django.core.exceptions import ObjectDoesNotExist
from project_management.models import Project, Task


def get_project_for_user(user, project_id):
    """
    Fetch a project scoped to the user's organization.
    Raises a safe error if not found or unauthorized.
    """
    try:
        return Project.objects.get(pk=project_id, organization=user.organization)
    except ObjectDoesNotExist:
        raise Exception("Not found or unauthorized")


def get_task_for_user(user, task_id):
    try:
        task = Task.objects.get(pk=task_id)
    except Task.DoesNotExist:
        raise Exception("Task not found")
    if task.project.organization != user.organization:
        raise Exception("Unauthorized")
    return task
