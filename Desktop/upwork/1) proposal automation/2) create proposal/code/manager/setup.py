from setuptools import setup, find_packages

setup(
    name="claude-task-manager",
    version="1.0.0",
    description="Management system for Claude AI tasks and sessions",
    author="",
    author_email="",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "flask>=2.0.0",
        "python-dateutil>=2.8.2",
    ],
    entry_points={
        "console_scripts": [
            "claude-dashboard=src.start_dashboard:main",
            "claude-monitor=src.claude_monitor:main",
        ],
    },
)
