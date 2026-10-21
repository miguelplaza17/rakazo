# Rakazo no Dokploy

Sobe o Rakazo inteiro (Postgres, API, worker, web e computadores Docker dos bots) como um
serviço **Docker Compose** do Dokploy, construído a partir deste repositório.

| Arquivo | Para quê |
|---|---|
| `Dockerfile` | Imagem do app. Instala só os workspaces do servidor (sem Electron/Expo). |
| `docker-compose.yml` | Stack completa, sem portas no host e sem redes próprias. |
| `env.example` | Variáveis para colar na aba Environment. |

## Requisitos do servidor

- Docker Engine 26 ou mais novo (os computadores dos bots usam subpaths de volume).
- 4 GB de RAM no mínimo para o build da imagem (8 GB recomendado). Cada computador de
  bot ligado usa até `RAKAZO_COMPUTER_MEMORY` (padrão 2 GB).
- Uns 15 GB livres em disco para as imagens.

## Passo a passo

1. **Projeto e serviço:** no Dokploy, crie um projeto e adicione um serviço **Compose**
   (tipo *Docker Compose*).
2. **Fonte:** em *General*, escolha GitHub (ou Git), aponte para este fork, branch `main`, e
   em **Compose Path** use `./infra/dokploy/docker-compose.yml`.
3. **Isolated Deployments:** em *Advanced*, ligue **Isolated Deployments**. O compose não
   declara redes e depende disso para os serviços se enxergarem e o Traefik alcançar o `web`.
4. **Variáveis:** em *Environment*, cole o conteúdo de `env.example` e troque todos os
   valores. Gere cada segredo separadamente:

   ```bash
   openssl rand -hex 32
   ```

5. **Domínio:** em *Domains*, adicione o domínio no serviço **`web`**, porta **5173**, com
   HTTPS (Let's Encrypt). Use o mesmo host de `RAKAZO_HOST`. Não adicione domínio em nenhum
   outro serviço; o `supervisor` tem acesso ao Docker do servidor.
6. **Deploy:** clique em *Deploy*. O primeiro build demora (imagem do app e imagem do
   computador dos bots). Os seguintes usam cache.
7. **Primeiro acesso:** abra `https://SEU_DOMINIO`, crie a conta com o e-mail que está em
   `SIGNUP_ALLOWLIST` (a primeira conta vira dona da instância) e conecte um modelo.

## Modelo com os créditos do plano Max

Os créditos mensais de API do Claude Max valem para uma API key comum do Console:

1. Em claude.ai → *Settings → Billing → API credits*, vincule uma organização do Console.
2. Crie uma API key nessa organização (de preferência num workspace só para o Rakazo, com
   limite de gasto).
3. No Rakazo, conecte o provedor **Anthropic** com essa chave. Não use o login
   "Claude Pro/Max" (não é permitido pelos termos da Anthropic) nem o Bedrock (não usa esses
   créditos).

Para deixar um modelo padrão para todos os bots, preencha `ANTHROPIC_API_KEY`,
`PI_DEFAULT_PROVIDER=anthropic` e `PI_DEFAULT_MODEL` na aba Environment.

## Atualizar a partir do upstream

```bash
git fetch upstream
git merge upstream/main
git push origin main
```

Com *Auto Deploy* ligado no Dokploy, o push dispara o deploy. Se `infra/compose/Dockerfile`
mudar no upstream (por exemplo um workspace novo em `pnpm-workspace.yaml`), replique a
mudança em `infra/dokploy/Dockerfile`.

## Backup

Os dados ficam nos volumes nomeados `pgdata` (banco) e `appdata` (arquivos e casas dos bots).
Configure *Volume Backups* no Dokploy para os dois.

## Problemas comuns

- **Build morre sem erro claro:** falta de memória no `vite build`. Adicione swap ou use um
  servidor maior.
- **`web` responde "Blocked request. This host is not allowed":** `RAKAZO_HOST` diferente do
  domínio configurado.
- **Bots não ligam o computador:** confira os logs do `supervisor` e a versão do Docker
  (`docker version`).
