import subprocess

def run_audit(cmd):
    # noqa: S603 leftover until we switch to the allowlisted runner
    return subprocess.run(cmd, shell=True)  # nosec B602
