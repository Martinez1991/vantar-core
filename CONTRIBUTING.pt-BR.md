> [English](CONTRIBUTING.md) · 🌐 **Português**

# Contribuindo

Obrigado pelo interesse em contribuir! O **OWASP Security Design Review
Framework** (núcleo aberto do Vantar) aceita contribuições da comunidade sob a
licença [Apache-2.0](LICENSE). Ao participar, você concorda com o
[Código de Conduta](CODE_OF_CONDUCT.pt-BR.md).

## Antes de começar

- Veja o [`ROADMAP.md`](ROADMAP.pt-BR.md) e as [issues](../../issues) abertas.
- Para mudanças grandes, abra primeiro uma issue/discussion para alinhar escopo.
- Entenda a fronteira **Open Core** em [`EDITIONS.md`](EDITIONS.pt-BR.md): contribuições
  ao framework aberto são sempre bem-vindas; mudanças em módulos `EE` (`ai`,
  `agents`, `integrations`, `auth/sso`) seguem o mesmo fluxo, mas a direção é da
  mantenedora.
- **Não reimplemente o OWASP ThreatAtlas.** O threat modeling aberto é
  gerador/curador e **integra-se** ao ThreatAtlas (system-of-record).

## Ambiente

Pré-requisitos: Node.js ≥ 20, Python ≥ 3.12, Docker.

```bash
npm install
npm run compose:up          # Postgres, Redis, RabbitMQ…
npm run dev                 # frontend → http://localhost:3000
```

## Padrões

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org)
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:`…).
- **Testes**: toda mudança de comportamento vem com testes. Rode antes do PR:
  ```bash
  npm run test --workspace @vantar/api
  npm run test --workspace @vantar/web
  npm run test:e2e --workspace @vantar/api   # requer Postgres + role vantar_app
  (cd apps/agents && python -m pytest tests --cov=app --cov-fail-under=80)
  ```
- **Cobertura**: o CI trava o núcleo (services/guards/helpers); não baixe os limiares.
- **Honestidade de engenharia**: sem mocks que fingem sucesso; degradação
  explícita quando uma dependência externa não está configurada.

## DCO (Developer Certificate of Origin)

Assine seus commits com `-s` (declara que você tem o direito de contribuir o código):

```bash
git commit -s -m "feat: ..."
```

## Pull Requests

1. Faça fork e crie um branch a partir de `main`.
2. Garanta build, lint e testes verdes localmente.
3. Abra o PR descrevendo o problema, a solução e como verificou.
4. Um PR por feature; mantenha o diff focado.

## Segurança

Vulnerabilidades **não** vão para issues públicas — veja [`SECURITY.md`](SECURITY.pt-BR.md).
