# CLAUDE.md - Project Configuration

## gstack

**对于所有网页浏览任务，使用 gstack 的 /browse skill。不要使用 mcp__claude-in-chrome__* 工具。**

### 安装 gstack

gstack 已配置在此项目中。首次使用的团队成员需要运行：

```bash
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

（setup 脚本需要安装 bun：`curl -fsSL https://bun.sh/install | bash`）

### Available gstack Skills

- `/office-hours` - Schedule office hours
- `/plan-ceo-review` - CEO review planning
- `/plan-eng-review` - Engineering review planning
- `/plan-design-review` - Design review planning
- `/design-consultation` - Design consultation
- `/review` - Code review
- `/ship` - Ship features
- `/land-and-deploy` - Land and deploy changes
- `/canary` - Canary deployments
- `/benchmark` - Performance benchmarking
- `/browse` - **Use this for all web browsing**
- `/qa` - Quality assurance testing
- `/qa-only` - QA only testing
- `/design-review` - Design review
- `/setup-browser-cookies` - Setup browser cookies
- `/setup-deploy` - Setup deployment
- `/retro` - Retrospectives
- `/investigate` - Investigation tasks
- `/document-release` - Release documentation
- `/codex` - Codex operations
- `/cso` - CSO operations
- `/autoplan` - Automatic planning
- `/careful` - Careful mode
- `/freeze` - Freeze changes
- `/guard` - Guard mode
- `/unfreeze` - Unfreeze changes
- `/gstack-upgrade` - Upgrade gstack
