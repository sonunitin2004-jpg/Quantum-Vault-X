/*
  # Quantum Vault X Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `neural_password_set` (boolean, default false)
      - `biometric_set` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `neural_passwords`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `password_hash` (text, encrypted neural password)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `biometric_data`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `biometric_hash` (text, encrypted biometric data)
      - `biometric_type` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `vault_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `file_name` (text)
      - `file_type` (text: 'image', 'video', 'file')
      - `file_path` (text, storage path)
      - `file_size` (bigint)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  neural_password_set boolean DEFAULT false,
  biometric_set boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create trigger function that runs on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, neural_password_set, biometric_set)
  VALUES (new.id, new.email, false, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create neural_passwords table
CREATE TABLE IF NOT EXISTS neural_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE neural_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own neural password"
  ON neural_passwords FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own neural password"
  ON neural_passwords FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own neural password"
  ON neural_passwords FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create biometric_data table
CREATE TABLE IF NOT EXISTS biometric_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  biometric_hash text NOT NULL,
  biometric_type text DEFAULT 'fingerprint',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own biometric data"
  ON biometric_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometric data"
  ON biometric_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometric data"
  ON biometric_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create vault_files table
CREATE TABLE IF NOT EXISTS vault_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  storage_path text NOT NULL,
  file_size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vault items"
  ON vault_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault items"
  ON vault_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items"
  ON vault_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for vault files
INSERT INTO storage.buckets (id, name, public)
VALUES ('qx-vault', 'qx-vault', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vault files
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'qx-vault' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'qx-vault' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'qx-vault' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );