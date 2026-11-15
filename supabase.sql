-- Ranking do jogo "Estaciona Aí" (thalissakezia.github.io)
-- Cole tudo no SQL Editor do Supabase e clique em "Run".

-- 1) Tabela: uma linha por jogador (cada aparelho tem um id próprio)
create table if not exists public.ranking (
  id          uuid primary key,
  nome        text not null check (char_length(nome) between 1 and 14),
  avatar      text not null default 'planilha' check (char_length(avatar) <= 20),
  pontos      integer not null check (pontos between 0 and 100000),
  media       real,
  fase        integer default 0,
  atualizado  timestamptz not null default now()
);

create index if not exists ranking_pontos_idx on public.ranking (pontos desc, atualizado asc);

-- 2) Segurança: qualquer pessoa pode LER o ranking,
--    mas ninguém escreve direto na tabela (só pela função abaixo)
alter table public.ranking enable row level security;

drop policy if exists "ranking publico para leitura" on public.ranking;
create policy "ranking publico para leitura"
  on public.ranking for select
  to anon, authenticated
  using (true);

-- 3) Função que salva a pontuação:
--    - jogador novo: entra no ranking
--    - jogador que já existe: só atualiza se a pontuação nova for MAIOR
--    - pontuação menor: não muda nada
create or replace function public.salvar_pontuacao(
  p_id uuid,
  p_nome text,
  p_avatar text,
  p_pontos integer,
  p_media real,
  p_fase integer
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := left(trim(p_nome), 14);
  v_melhor integer;
  v_pos integer;
  v_total integer;
  v_subiu boolean := false;
begin
  if v_nome = '' or lower(v_nome) = 'thalissa' then
    raise exception 'apelido invalido';
  end if;
  if p_pontos < 0 or p_pontos > 100000 then
    raise exception 'pontuacao invalida';
  end if;

  insert into ranking as r (id, nome, avatar, pontos, media, fase, atualizado)
  values (p_id, v_nome, left(coalesce(p_avatar, 'planilha'), 20), p_pontos, p_media, coalesce(p_fase, 0), now())
  on conflict (id) do update
    set nome = excluded.nome,
        avatar = excluded.avatar,
        pontos = excluded.pontos,
        media = excluded.media,
        fase = excluded.fase,
        atualizado = now()
    where excluded.pontos > r.pontos;

  get diagnostics v_total = row_count;
  v_subiu := v_total > 0;

  select pontos into v_melhor from ranking where id = p_id;
  select count(*) + 1 into v_pos from ranking where pontos > v_melhor;
  select count(*) into v_total from ranking;

  return json_build_object('melhor', v_melhor, 'posicao', v_pos, 'total', v_total, 'subiu', v_subiu);
end;
$$;

revoke all on function public.salvar_pontuacao(uuid, text, text, integer, real, integer) from public;
grant execute on function public.salvar_pontuacao(uuid, text, text, integer, real, integer) to anon, authenticated;
