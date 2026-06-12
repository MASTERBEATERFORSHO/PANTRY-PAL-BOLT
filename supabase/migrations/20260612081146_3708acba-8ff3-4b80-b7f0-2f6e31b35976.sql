
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🥗',
  base_shelf_life_days INTEGER NOT NULL,
  optimal_window_start_day INTEGER NOT NULL DEFAULT 0,
  optimal_window_end_day INTEGER NOT NULL,
  storage_tips TEXT NOT NULL,
  basic_nutrition_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  ripeness_applicable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ingredients_name_idx ON public.ingredients (lower(name));
GRANT SELECT ON public.ingredients TO authenticated;
GRANT ALL ON public.ingredients TO service_role;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ingredients readable by authenticated users"
  ON public.ingredients FOR SELECT TO authenticated USING (true);

CREATE TABLE public.user_pantry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
  custom_name TEXT,
  display_name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🥗',
  quantity TEXT NOT NULL DEFAULT '1',
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ripeness TEXT,
  shelf_life_days INTEGER NOT NULL,
  optimal_window_start_day INTEGER NOT NULL DEFAULT 0,
  optimal_window_end_day INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  storage_tips TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_pantry_user_idx ON public.user_pantry (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_pantry TO authenticated;
GRANT ALL ON public.user_pantry TO service_role;
ALTER TABLE public.user_pantry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pantry"
  ON public.user_pantry FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.tg_user_pantry_set_updated()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER user_pantry_updated_at
  BEFORE UPDATE ON public.user_pantry
  FOR EACH ROW EXECUTE FUNCTION public.tg_user_pantry_set_updated();
