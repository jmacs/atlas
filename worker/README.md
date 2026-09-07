# Worker

Background execution code belongs here: the task registry, scheduler, process
runner, output capture, and restart recovery. Worker code may depend on
`database/`, but it must not depend on Hono request handlers or browser assets.
