# assumptions and design decisions

## tenant isolation
There are many way to ensure this 
1. all data in the same schema using same tables but isolated using where clause
2. same as 1st but with RLS to enforce isolate at the db level
3. same db for diff schema for each tenant — too complicated for this scope
I am going with option 1 for this demo app.

## auth
- this is single org per user by design to be able to ship within the deadline - a known/intentional limitation


# playground
okay I have setup the base repos... I will install some libs, lets get done with backend first. I installed and setup django...