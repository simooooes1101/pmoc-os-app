-- ====================================================================
-- MIGRATION SCRIPT — AUDIT LOGS, USER STATUS & DYNAMIC TECHNICIAN PIN
-- Execute este script no SQL Editor do seu painel Supabase
-- ====================================================================

-- 1. Adiciona o campo PIN na tabela de técnicos (com valor padrão '1234')
alter table public.tecnicos 
add column if not exists pin varchar default '1234';

-- 2. Adiciona o campo STATUS na tabela de perfis de usuário (com valor padrão 'Ativo')
alter table public.perfis 
add column if not exists status varchar default 'Ativo';

-- 3. Cria a tabela de logs de usuários para rastreabilidade completa (Auditoria)
create table if not exists public.logs_usuario (
    id uuid primary key default gen_random_uuid(),
    usuario_email varchar not null,
    acao varchar not null,
    detalhes text,
    created_at timestamp with time zone default now()
);

-- 4. Habilita RLS (Row Level Security) na tabela de logs
alter table public.logs_usuario enable row level security;

-- 5. Cria as políticas de acesso público para permitir inserção e leitura de logs no app
drop policy if exists "Public Select Logs" on public.logs_usuario;
create policy "Public Select Logs" on public.logs_usuario 
for select using (true);

drop policy if exists "Public Insert Logs" on public.logs_usuario;
create policy "Public Insert Logs" on public.logs_usuario 
for insert with check (true);

-- 6. Libera as políticas de RLS da tabela 'perfis' para evitar violações de segurança e recursão
drop policy if exists "Perfis são legíveis por todos os autenticados" on public.perfis;
drop policy if exists "Administradores podem gerenciar perfis" on public.perfis;
drop policy if exists "Usuários podem atualizar seus próprios perfis" on public.perfis;
drop policy if exists "Public Select Perfis" on public.perfis;
drop policy if exists "Public Insert Perfis" on public.perfis;
drop policy if exists "Public Update Perfis" on public.perfis;
drop policy if exists "Public Delete Perfis" on public.perfis;

create policy "Public Select Perfis" on public.perfis for select using (true);
create policy "Public Insert Perfis" on public.perfis for insert with check (true);
create policy "Public Update Perfis" on public.perfis for update using (true);
create policy "Public Delete Perfis" on public.perfis for delete using (true);
