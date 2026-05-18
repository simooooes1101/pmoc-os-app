-- ============================================================
-- SCHEMA DE INICIALIZAÇÃO — DIGITAL PMOC SYSTEM
-- Banco de Dados: PostgreSQL (Supabase)
-- ============================================================

-- Habilitar extensão para UUIDs se necessário
create extension if not exists "uuid-ossp";

-- Limpar tabelas se já existirem (para fins de desenvolvimento)
drop table if exists public.notificacoes cascade;
drop table if exists public.ordens_servico cascade;
drop table if exists public.pmocs cascade;
drop table if exists public.equipamentos cascade;
drop table if exists public.perfis cascade;
drop table if exists public.tecnicos cascade;
drop table if exists public.clientes cascade;
drop table if exists public.responsavel_tecnico cascade;

-- ── 1. TABELA DE RESPONSÁVEL TÉCNICO ──────────────────────────
create table public.responsavel_tecnico (
    id varchar primary key,
    nome varchar not null,
    crea varchar not null,
    art varchar not null,
    telefone varchar,
    email varchar,
    assinatura_url varchar,
    created_at timestamp with time zone default now()
);

-- ── 2. TABELA DE CLIENTES ────────────────────────────────────
create table public.clientes (
    id varchar primary key,
    razao_social varchar not null,
    nome_fantasia varchar not null,
    cnpj varchar,
    endereco text,
    telefone varchar,
    email_responsavel varchar,
    tipo_ambiente varchar,
    area_climatizada float,
    numero_ocupantes integer,
    horario_funcionamento varchar,
    sistema_renovacao_ar varchar,
    pmoc_ativo boolean default false,
    created_at timestamp with time zone default now()
);

-- ── 3. TABELA DE TÉCNICOS ────────────────────────────────────
create table public.tecnicos (
    id varchar primary key,
    nome varchar not null,
    cpf varchar,
    telefone varchar,
    email varchar unique,
    especialidade varchar,
    status varchar default 'Ativo',
    created_at timestamp with time zone default now()
);

-- ── 4. TABELA DE PERFIS DE USUÁRIO (Vínculo com Supabase Auth) ──
create table public.perfis (
    id uuid references auth.users on delete cascade primary key,
    nome varchar not null,
    email varchar not null,
    role varchar not null default 'tecnico' check (role in ('admin', 'tecnico')),
    tecnico_id varchar references public.tecnicos(id) on delete set null,
    created_at timestamp with time zone default now()
);

-- ── 5. TABELA DE EQUIPAMENTOS ─────────────────────────────────
create table public.equipamentos (
    id varchar primary key,
    cliente_id varchar references public.clientes(id) on delete cascade not null,
    codigo varchar not null,
    tipo varchar,
    marca varchar,
    modelo varchar,
    capacidade_btu integer,
    localizacao_exata varchar,
    tensao varchar,
    numero_serie varchar,
    data_instalacao date,
    status varchar default 'Operacional',
    ultima_manutencao date,
    proxima_manutencao date,
    created_at timestamp with time zone default now()
);

-- ── 6. TABELA DE PMOCS ────────────────────────────────────────
create table public.pmocs (
    id varchar primary key,
    cliente_id varchar references public.clientes(id) on delete cascade unique not null,
    responsavel_tecnico_id varchar references public.responsavel_tecnico(id) on delete set null,
    ativo boolean default true,
    data_inicio date not null,
    data_vigencia date not null,
    periodicidades jsonb default '{"mensal": [], "semestral": []}'::jsonb,
    agendamentos jsonb default '[]'::jsonb,
    created_at timestamp with time zone default now()
);

-- ── 7. TABELA DE ORDENS DE SERVIÇO ─────────────────────────────
create table public.ordens_servico (
    id varchar primary key,
    cliente_id varchar references public.clientes(id) on delete cascade not null,
    equipamento_id varchar references public.equipamentos(id) on delete cascade not null,
    tecnico_id varchar references public.tecnicos(id) on delete set null,
    tipo varchar not null default 'Preventiva',
    status varchar not null default 'Aguardando',
    prioridade varchar not null default 'Normal',
    titulo varchar not null,
    descricao text,
    data_abertura timestamp with time zone default now(),
    data_prevista timestamp with time zone,
    data_conclusao timestamp with time zone,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    sla_horas integer default 48,
    valor_estimado numeric(10,2),
    valor_final numeric(10,2),
    pecas_utilizadas jsonb default '[]'::jsonb,
    checklist jsonb default '[]'::jsonb,
    fotos jsonb default '[]'::jsonb,
    observacoes text,
    historico jsonb default '[]'::jsonb,
    created_at timestamp with time zone default now()
);

-- ── 8. TABELA DE NOTIFICAÇÕES ─────────────────────────────────
create table public.notificacoes (
    id uuid primary key default gen_random_uuid(),
    tecnico_id varchar references public.tecnicos(id) on delete cascade not null,
    mensagem text not null,
    lida boolean default false,
    data timestamp with time zone default now()
);

-- ============================================================
-- INSERÇÃO DE DADOS INICIAIS (MOCK DATA)
-- ============================================================

-- Responsável Técnico
insert into public.responsavel_tecnico (id, nome, crea, art, telefone, email)
values ('RT001', 'Eng. Marcus Vinícius Albuquerque', 'CREA-SP 123.456-D', 'ART-SP-2025-00789', '(11) 3456-8800', 'marcus.albuquerque@climatiza.com.br');

-- Clientes
insert into public.clientes (id, razao_social, nome_fantasia, cnpj, endereco, telefone, email_responsavel, tipo_ambiente, area_climatizada, numero_ocupantes, horario_funcionamento, sistema_renovacao_ar, pmoc_ativo) values 
('CLI001', 'Hospital São Lucas S.A.', 'Hospital São Lucas', '12.345.678/0001-99', 'Av. Brasil, 1500, Centro, São Paulo/SP', '(11) 3456-7890', 'facilities@saolucas.com.br', 'Hospitalar', 4200, 850, '24 horas', 'Central - VAV', true),
('CLI002', 'Shopping Ibirapuera Empreendimentos Ltda.', 'Shopping Ibirapuera', '98.765.432/0001-11', 'Av. Ibirapuera, 3103, Indianópolis, São Paulo/SP', '(11) 5555-9900', 'manutencao@ibirapuera.com.br', 'Comercial - Shopping', 28000, 12000, '10h às 22h', 'Chillers centrais + AHU', true),
('CLI003', 'Escola Estadual João Pessoa', 'E.E. João Pessoa', 'Entidade Pública', 'Rua das Flores, 200, Vila Mariana, São Paulo/SP', '(11) 4002-8922', 'diretoria@eejp.edu.br', 'Educacional - Público', 1800, 620, '7h às 22h', 'Split - Renovação natural', false),
('CLI004', 'Banco Meridional S.A.', 'Banco Meridional', '55.123.456/0001-77', 'Av. Paulista, 2000, Bela Vista, São Paulo/SP', '(11) 3333-4444', 'infraestrutura@meridional.com.br', 'Corporativo - Financeiro', 3600, 420, '08h às 20h', 'VRF + DOAS', true);

-- Técnicos
insert into public.tecnicos (id, nome, cpf, telefone, email, especialidade, status) values
('TEC001', 'Carlos Eduardo Mendes', '123.456.789-01', '(11) 99876-5432', 'carlos.mendes@climatiza.com.br', 'Refrigeração Industrial', 'Ativo'),
('TEC002', 'Ana Paula Ferreira', '987.654.321-00', '(11) 91234-5678', 'ana.ferreira@climatiza.com.br', 'Higienização de Dutos', 'Ativo'),
('TEC003', 'Roberto Souza Lima', '456.789.123-55', '(11) 95555-0011', 'roberto.lima@climatiza.com.br', 'Sistemas VRF', 'Ativo'),
('TEC004', 'Fernanda Oliveira', '321.654.987-22', '(11) 98765-1234', 'fernanda.oliveira@climatiza.com.br', 'Análise de Qualidade do Ar', 'Férias');

-- Equipamentos
insert into public.equipamentos (id, cliente_id, codigo, tipo, marca, modelo, capacidade_btu, localizacao_exata, tensao, numero_serie, data_instalacao, status, ultima_manutencao, proxima_manutencao) values
('EQ001', 'CLI001', 'HSL-AC-001', 'Split Hi-Wall', 'Carrier', '42XCB018515LC', 18000, 'Bloco A - UTI - Sala 01', '220V', 'CAR2024001XQ', '2023-06-15', 'Operacional', '2025-04-10', '2025-05-10'),
('EQ002', 'CLI001', 'HSL-AC-002', 'Split Cassete', 'Daikin', 'FCQN60LUV1', 60000, 'Bloco B - Centro Cirúrgico', '220V', 'DAI2023002YZ', '2023-01-20', 'Em Manutenção', '2025-03-01', '2025-05-16'),
('EQ003', 'CLI002', 'SHI-CHIL-001', 'Chiller', 'Trane', 'CGAM070', 840000, 'Casa de Máquinas - Subsolo 2', '380V', 'TRA2022003WW', '2022-11-05', 'Operacional', '2025-05-01', '2025-06-01'),
('EQ004', 'CLI004', 'BME-VRF-001', 'Unidade Condensadora VRF', 'Mitsubishi Electric', 'PUHY-P400YKM-A', 136000, 'Cobertura - Terraço Norte', '380V', 'MIT2024001AA', '2024-01-10', 'Operacional', '2025-04-20', '2025-05-20');

-- PMOCs
insert into public.pmocs (id, cliente_id, responsavel_tecnico_id, ativo, data_inicio, data_vigencia, periodicidades, agendamentos) values
('PMOC001', 'CLI001', 'RT001', true, '2025-01-01', '2025-12-31', '{"mensal": ["Limpeza de filtros", "Inspeção elétrica", "Limpeza de dreno"], "semestral": ["Higienização completa", "Análise microbiológica"]}', '[{"data": "2025-06-01", "tipo": "Mensal", "status": "Agendado", "equipamentoId": "EQ001"}, {"data": "2025-06-01", "tipo": "Mensal", "status": "Agendado", "equipamentoId": "EQ002"}, {"data": "2025-07-01", "tipo": "Mensal", "status": "Agendado", "equipamentoId": "EQ001"}, {"data": "2025-07-01", "tipo": "Semestral", "status": "Agendado", "equipamentoId": "EQ002"}]'),
('PMOC002', 'CLI002', 'RT001', true, '2025-01-01', '2025-12-31', '{"mensal": ["Limpeza de filtros", "Inspeção elétrica", "Limpeza de dreno"], "semestral": ["Higienização completa", "Análise microbiológica"]}', '[{"data": "2025-06-01", "tipo": "Mensal", "status": "Agendado", "equipamentoId": "EQ003"}]'),
('PMOC004', 'CLI004', 'RT001', true, '2025-01-01', '2025-12-31', '{"mensal": ["Limpeza de filtros", "Inspeção elétrica", "Limpeza de dreno"], "semestral": ["Higienização completa", "Análise microbiológica"]}', '[{"data": "2025-06-01", "tipo": "Mensal", "status": "Agendado", "equipamentoId": "EQ004"}]');

-- Ordens de Serviço
insert into public.ordens_servico (id, cliente_id, equipamento_id, tecnico_id, tipo, status, prioridade, titulo, descricao, data_abertura, data_prevista, data_conclusao, check_in, check_out, sla_horas, valor_estimado, valor_final, pecas_utilizadas, checklist, fotos, observacoes, historico) values
(
  'OS-2025-0156', 'CLI001', 'EQ001', 'TEC001', 'Preventiva', 'Em andamento', 'Alta', 'Manutenção Preventiva Mensal — UTI Bloco A', 'Limpeza de filtros, inspeção elétrica e limpeza de dreno conforme PMOC.', 
  '2025-05-14T08:00:00Z', '2025-05-16T17:00:00Z', null, '2025-05-16T09:15:00Z', null, 48, 650.00, null, '[]',
  '[{"id": "1", "item": "Limpeza de filtros", "concluido": true, "obrigatorio": true}, {"id": "2", "item": "Bandeja higienizada", "concluido": true, "obrigatorio": true}, {"id": "3", "item": "Dreno desobstruído", "concluido": false, "obrigatorio": true}, {"id": "4", "item": "Serpentina limpa", "concluido": false, "obrigatorio": false}, {"id": "5", "item": "Conexões elétricas verificadas", "concluido": true, "obrigatorio": true}]',
  '[]', 'Encontrado acúmulo de fungos na bandeja. Aguardando produto químico.',
  '[{"data": "2025-05-14T08:00:00Z", "acao": "OS Aberta", "usuario": "Gestor Admin"}, {"data": "2025-05-14T08:05:00Z", "acao": "Técnico Atribuído: Carlos Eduardo Mendes", "usuario": "Gestor Admin"}, {"data": "2025-05-16T09:15:00Z", "acao": "Check-in realizado (GPS: -23.5505, -46.6333)", "usuario": "Carlos Eduardo Mendes"}]'
),
(
  'OS-2025-0157', 'CLI002', 'EQ003', 'TEC003', 'Corretiva', 'Aguardando', 'Urgente', 'Falha no Chiller — Compressor Não Liga', 'Chiller CGAM070 apresentou falha no compressor 2. Sistema em redundância parcial.', 
  '2025-05-16T06:30:00Z', '2025-05-16T14:00:00Z', null, null, null, 8, 3200.00, null, '[]', '[]', '[]', 'Código de erro: E53 — Sobrecorrente no compressor.',
  '[{"data": "2025-05-16T06:30:00Z", "acao": "OS Aberta — Urgência identificada", "usuario": "Sistema PMOC"}, {"data": "2025-05-16T06:32:00Z", "acao": "Técnico Atribuído: Roberto Souza Lima", "usuario": "Gestor Admin"}]'
),
(
  'OS-2025-0148', 'CLI004', 'EQ004', 'TEC001', 'Preventiva', 'Concluída', 'Normal', 'Preventiva Semestral — VRF Cobertura', 'Higienização completa e análise microbiológica conforme PMOC semestral.', 
  '2025-05-10T07:00:00Z', '2025-05-12T17:00:00Z', '2025-05-12T14:30:00Z', '2025-05-12T08:00:00Z', '2025-05-12T14:30:00Z', 48, 1800.00, 1850.00, 
  '[{"descricao": "Filtro HEPA replacement", "quantidade": 4, "valorUnit": 45.00}]',
  '[{"id": "1", "item": "Limpeza de filtros", "concluido": true, "obrigatorio": true}, {"id": "2", "item": "Bandeja higienizada", "concluido": true, "obrigatorio": true}, {"id": "3", "item": "Dreno desobstruído", "concluido": true, "obrigatorio": true}]',
  '[]', 'Todos os itens verificados. Laudo gerado automaticamente.',
  '[{"data": "2025-05-10T07:00:00Z", "acao": "OS Aberta", "usuario": "Sistema PMOC"}, {"data": "2025-05-12T08:00:00Z", "acao": "Check-in (GPS: -23.5618, -46.6565)", "usuario": "Carlos Eduardo Mendes"}, {"data": "2025-05-12T14:30:00Z", "acao": "Check-out — OS Concluída", "usuario": "Carlos Eduardo Mendes"}, {"data": "2025-05-12T14:31:00Z", "acao": "Laudo PDF gerado automaticamente", "usuario": "Sistema"}, {"data": "2025-05-12T14:32:00Z", "acao": "WhatsApp enviado ao cliente", "usuario": "Sistema"}, {"data": "2025-05-12T14:32:00Z", "acao": "E-mail de relatório enviado", "usuario": "Sistema"}]'
),
(
  'OS-2025-0142', 'CLI001', 'EQ002', 'TEC002', 'Preventiva', 'Cancelada', 'Normal', 'Higienização Centro Cirúrgico — Adiada', 'Higienização semestral cancelada a pedido do cliente — centro cirúrgico em uso emergencial.', 
  '2025-05-08T10:00:00Z', '2025-05-09T17:00:00Z', null, null, null, 48, 2200.00, 0, '[]', '[]', '[]', 'Reagendar para semana de 19/05.',
  '[{"data": "2025-05-08T10:00:00Z", "acao": "OS Aberta", "usuario": "Gestor Admin"}, {"data": "2025-05-09T07:15:00Z", "acao": "OS Cancelada — Motivo: Solicitação do cliente", "usuario": "Gestor Admin"}]'
),
(
  'OS-2025-0158', 'CLI001', 'EQ001', 'TEC002', 'Preventiva', 'Aguardando', 'Normal', 'Análise Microbiológica — Bloco A', 'Coleta de amostras para análise microbiológica semestral conforme ANVISA RE 09/2003.', 
  '2025-05-16T11:00:00Z', '2025-05-20T17:00:00Z', null, null, null, 96, 1200.00, null, '[]', '[]', '[]', '',
  '[{"data": "2025-05-16T11:00:00Z", "acao": "OS Aberta — PMOC Semestral", "usuario": "Sistema PMOC"}]'
);

-- ============================================================
-- SEGURANÇA E POLÍTICAS DE ACESSO (ROW-LEVEL SECURITY)
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table public.responsavel_tecnico enable row level security;
alter table public.clientes enable row level security;
alter table public.tecnicos enable row level security;
alter table public.perfis enable row level security;
alter table public.equipamentos enable row level security;
alter table public.pmocs enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.notificacoes enable row level security;

-- ── 1. POLÍTICAS PARA PERFIS ──────────────────────────────────
create policy "Perfis são legíveis por todos os autenticados" 
on public.perfis for select to authenticated using (true);

create policy "Administradores podem gerenciar perfis" 
on public.perfis for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);

create policy "Usuários podem atualizar seus próprios perfis" 
on public.perfis for update to authenticated using (
  id = auth.uid()
);

-- ── 2. POLÍTICAS PARA TABELAS GERAIS ───────────────────────────
-- Leitura permitida para todos os autenticados
create policy "Autenticados podem ler clientes" on public.clientes for select to authenticated using (true);
create policy "Autenticados podem ler equipamentos" on public.equipamentos for select to authenticated using (true);
create policy "Autenticados podem ler pmocs" on public.pmocs for select to authenticated using (true);
create policy "Autenticados podem ler resp_tecnico" on public.responsavel_tecnico for select to authenticated using (true);
create policy "Autenticados podem ler técnicos" on public.tecnicos for select to authenticated using (true);

-- Escrita restrita a administradores
create policy "Admins podem gerenciar clientes" on public.clientes for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);
create policy "Admins podem gerenciar equipamentos" on public.equipamentos for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);
create policy "Admins podem gerenciar pmocs" on public.pmocs for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);
create policy "Admins podem gerenciar resp_tecnico" on public.responsavel_tecnico for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);
create policy "Admins podem gerenciar técnicos" on public.tecnicos for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);

-- ── 3. POLÍTICAS PARA ORDENS DE SERVIÇO ───────────────────────
-- Admins têm controle total
create policy "Admins têm controle total sobre OS" on public.ordens_servico for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);
-- Técnicos podem ver ordens atribuídas a eles
create policy "Técnicos podem ler suas OS" on public.ordens_servico for select to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin' or
  tecnico_id = (select tecnico_id from public.perfis where id = auth.uid())
);
-- Técnicos podem atualizar ordens atribuídas a eles
create policy "Técnicos podem atualizar suas OS" on public.ordens_servico for update to authenticated using (
  tecnico_id = (select tecnico_id from public.perfis where id = auth.uid())
);

-- ── 4. POLÍTICAS PARA NOTIFICAÇÕES ─────────────────────────────
-- Admins têm controle total
create policy "Admins têm controle total sobre notificacoes" on public.notificacoes for all to authenticated using (
  (select role from public.perfis where id = auth.uid()) = 'admin'
);
-- Técnicos gerenciam suas próprias notificações
create policy "Técnicos gerenciam suas próprias notificacoes" on public.notificacoes for all to authenticated using (
  tecnico_id = (select tecnico_id from public.perfis where id = auth.uid())
);
