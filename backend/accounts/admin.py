from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Organization
from .forms import CustomUserCreationForm, CustomUserChangeForm


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser

    list_display = ("email", "organization", "is_staff", "is_active")
    list_filter = ("organization", "is_staff", "is_active")

    fieldsets = (
        (None, {"fields": ("email", "password", "organization")}),
        ("Permissions", {"fields": ("is_staff",
         "is_active", "groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "organization", "password1", "password2", "is_staff", "is_active")}
         ),
    )

    search_fields = ("email",)
    ordering = ("email",)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "contact_email")
