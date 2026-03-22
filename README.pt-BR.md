# Stickban

Um quadro Kanban persistente que fica visivel na sua area de trabalho.

For the English version, see [`README.md`](./README.md).

## Visao Geral

Stickban e um aplicativo desktop de Kanban focado em velocidade, baixo atrito e visibilidade constante. A direcao do produto e offline-first, com persistencia local como fonte primaria de dados e sincronizacao opcional em nuvem entre dispositivos.

## Estado Atual

Este repositorio esta em fase de bootstrap. A especificacao do produto existe em [`SPEC.md`](./SPEC.md), mas o scaffold da aplicacao ainda nao foi criado.

A documentacao deste repositorio serve para estabelecer direcao antes do inicio da implementacao.

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

- MVP: quadro unico, 3 colunas, drag and drop, persistencia em SQLite, always-on-top
- Fase 2: multiplos quadros, sync com Google Drive, system tray, temas
- Futuro: campos customizados, notificacoes, resolucao avancada de conflitos, app mobile complementar

## Documentos do Repositorio

- [`README.md`](./README.md): versao em ingles deste README
- [`SPEC.md`](./SPEC.md): especificacao do produto
- [`ROADMAP.md`](./ROADMAP.md): marcos planejados e prioridades futuras
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md): estado atual do repositorio e marcos entregues
- [`AGENTS.md`](./AGENTS.md): guia operacional para agentes de programacao
- [`DECISIONS.md`](./DECISIONS.md): registro de decisoes arquiteturais

## Desenvolvimento Assistido por IA

O Stickban foi concebido desde o inicio como um projeto desenvolvido com ferramentas assistidas por IA, incluindo ferramentas como Codex, Claude, Antigravity e sistemas equivalentes. O modelo preferencial de manutencao deste repositorio e continuar usando ferramentas de desenvolvimento com IA como fluxo principal, sem impedir edicoes manuais diretas quando elas forem a melhor opcao para uma tarefa.

## Nota de Transparencia

Este repositorio pode conter codigo, documentacao e estrutura de projeto criados ou refinados com assistencia de IA e revisao humana. O uso de IA nao elimina a necessidade de validacao tecnica. O projeto nao oferece qualquer garantia adicional alem dos termos ja definidos em [`LICENSE`](./LICENSE), e a revisao independente continua recomendavel para usos comerciais, regulados ou de maior risco.

## Como Comecar Hoje

Ainda nao existe um scaffold executavel da aplicacao. O proximo passo atual e transformar a especificacao do produto na estrutura inicial do projeto com Electron/React/TypeScript.
O estado atual do repositorio esta documentado em [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).

## Licenca

Este repositorio inclui a licenca MIT em [`LICENSE`](./LICENSE).
