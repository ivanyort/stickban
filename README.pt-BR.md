# Stickban

Um quadro Kanban persistente que fica visivel na sua area de trabalho.

For the English version, see [`README.md`](./README.md).

## Visao Geral

Stickban e um aplicativo desktop de Kanban focado em velocidade, baixo atrito e visibilidade constante. A direcao do produto e offline-first, com persistencia local como fonte primaria de dados e sincronizacao opcional em nuvem entre dispositivos.

## Estado Atual

Este repositorio esta em fase de bootstrap. A especificacao do produto existe em [`SPEC.md`](./SPEC.md), e o primeiro scaffold executavel da aplicacao agora ja existe.

A documentacao deste repositorio serve para estabelecer direcao enquanto a implementacao ainda amadurece.
O milestone tecnico atual continua local-first e nao inclui sync remoto, OAuth ou infraestrutura externa.
O milestone executavel atual ja cobre multiplos quadros locais, colunas especificas por quadro, reordenacao e movimento de colunas entre quadros, persistencia em SQLite, drag and drop e always-on-top.

## Direcao do Produto

- Fluxo de Kanban orientado a desktop
- Comportamento de widget fixo, com modo always-on-top opcional
- Experiencia leve e rapida
- Arquitetura offline-first
- Persistencia local em SQLite
- Sincronizacao opcional com Google Drive

## Stack Planejada

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Zustand para gerenciamento de estado
- Tailwind CSS
- `dnd-kit` para drag and drop

## Recorte Inicial de Implementacao

- Manter o stack desktop local: Electron, React + TypeScript, `better-sqlite3`, Zustand, Tailwind CSS e `dnd-kit`
- Deixar Google Drive sync, OAuth e infraestrutura remota fora do primeiro scaffold
- Focar o milestone atual em um workspace totalmente local com multiplos quadros, colunas especificas por quadro, rename inline de colunas, drag and drop de colunas, persistencia em SQLite e always-on-top
- Tratar sync como capability posterior, nao como requisito do bootstrap

## Desenvolvimento Local

Pre-requisitos:

- Node.js 18+ recomendado
- npm

Comandos:

```bash
npm install
npm run dev
npm run site:build
```

Se voce estiver rodando como `root` em WSL/Linux, use:

```bash
npm run dev:root
```

Build de producao:

```bash
npm run build
npm run dist
```

Para abrir o app buildado como `root`:

```bash
npm run start:root
```

## Principios Centrais

- Dados locais sao a fonte de verdade
- Interacoes da interface devem permanecer responsivas
- A sincronizacao nao deve bloquear a interface
- Dados locais nao podem ser perdidos por falhas de sincronizacao
- Desenvolvimento assistido por IA e o fluxo padrao, com edicoes manuais permitidas quando fizer sentido
- Mudancas arquiteturais devem permanecer alinhadas com [`SPEC.md`](./SPEC.md) e [`DECISIONS.md`](./DECISIONS.md)

## Estrutura Planejada do Projeto

A estrutura abaixo esta planejada, mas ainda nao foi implementada.

```text
/app
  /main
  /renderer
  /db
  /services
    /sync
    /googleDrive
  /models
  /store
  /components
  /hooks
  /utils
```

## Resumo do Roadmap

Para o roadmap detalhado, veja [`ROADMAP.md`](./ROADMAP.md).

- MVP: workspace local, multiplos quadros, colunas customizaveis, drag and drop de colunas, persistencia em SQLite, always-on-top
- Fase 2: sync com Google Drive, system tray, temas
- Futuro: campos customizados, notificacoes, resolucao avancada de conflitos, app mobile complementar

## Documentos do Repositorio

- [`README.md`](./README.md): versao em ingles deste README
- [`SPEC.md`](./SPEC.md): especificacao do produto
- [`ROADMAP.md`](./ROADMAP.md): marcos planejados e prioridades futuras
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md): estado atual do repositorio e marcos entregues
- [`AGENTS.md`](./AGENTS.md): guia operacional para agentes de programacao
- [`DECISIONS.md`](./DECISIONS.md): registro de decisoes arquiteturais

## Landing Page

- O projeto inclui uma landing page publica buildada a partir de [`site/`](./site)
- A landing page foi pensada para publicacao no GitHub Pages
- O dominio publico canonico e `stickban.com`
- Forks podem buildar o site, mas a publicacao automatica no Pages fica restrita ao repositorio oficial

## Releases

- Cada push para `main` deve gerar uma GitHub Release automatica
- A versao da release e calculada a partir das commit conventions desde a ultima tag SemVer
- `feat` sobe minor, `fix` e tipos operacionais sobem patch, e `BREAKING CHANGE` ou `type!` sobem major
- Artefatos publicos de release sao gerados atualmente apenas para Windows
- As releases de Windows sao distribuidas como instalador NSIS
- O empacotamento para Linux continua disponivel localmente, mas artefatos Linux nao sao publicados nas GitHub Releases neste momento
- A landing page publica e publicada separadamente do pipeline de release do app desktop

## Desenvolvimento Assistido por IA

O Stickban foi concebido desde o inicio como um projeto desenvolvido com ferramentas assistidas por IA, incluindo ferramentas como Codex, Claude, Antigravity e sistemas equivalentes. O modelo preferencial de manutencao deste repositorio e continuar usando ferramentas de desenvolvimento com IA como fluxo principal, sem impedir edicoes manuais diretas quando elas forem a melhor opcao para uma tarefa.

## Nota de Transparencia

Este repositorio pode conter codigo, documentacao e estrutura de projeto criados ou refinados com assistencia de IA e revisao humana. O uso de IA nao elimina a necessidade de validacao tecnica. O projeto nao oferece qualquer garantia adicional alem dos termos ja definidos em [`LICENSE`](./LICENSE), e a revisao independente continua recomendavel para usos comerciais, regulados ou de maior risco.

## Como Comecar Hoje

O repositorio agora contem um scaffold executavel local-first em Electron/React/TypeScript para o primeiro milestone.
O estado atual do repositorio esta documentado em [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
Espera-se que o scaffold inicial funcione sem servicos pagos, assinaturas, infraestrutura cloud ou integracao com Google.

## Licenca

Este repositorio inclui a licenca MIT em [`LICENSE`](./LICENSE).
