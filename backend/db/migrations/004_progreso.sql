CREATE TABLE IF NOT EXISTS public.progreso (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clase_id text NOT NULL,
  completado boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT progreso_pkey PRIMARY KEY (user_id, clase_id)
);

ALTER TABLE public.progreso ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON TABLE public.progreso TO authenticated;

DROP POLICY IF EXISTS progreso_usuarios_propios ON public.progreso;
CREATE POLICY progreso_usuarios_propios
  ON public.progreso
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
