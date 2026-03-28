--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.10.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.10.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.templates DROP CONSTRAINT IF EXISTS templates_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_team_id_fkey;
DROP INDEX IF EXISTS public.idx_users_team_id;
DROP INDEX IF EXISTS public.idx_teams_template_id;
DROP INDEX IF EXISTS public.idx_reports_user_id;
DROP INDEX IF EXISTS public.idx_reports_template_id;
DROP INDEX IF EXISTS public.idx_reports_team_id;
DROP INDEX IF EXISTS public.idx_reports_created_at;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.templates DROP CONSTRAINT IF EXISTS templates_pkey;
ALTER TABLE IF EXISTS ONLY public.teams DROP CONSTRAINT IF EXISTS teams_pkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.templates;
DROP TABLE IF EXISTS public.teams;
DROP TABLE IF EXISTS public.reports;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: reports_user
--

CREATE TABLE public.reports (
    id uuid NOT NULL,
    user_id bigint NOT NULL,
    team_id uuid NOT NULL,
    template_id uuid NOT NULL,
    title text NOT NULL,
    answers jsonb NOT NULL,
    template_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reports OWNER TO reports_user;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: reports_user
--

CREATE TABLE public.teams (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    template_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint
);


ALTER TABLE public.teams OWNER TO reports_user;

--
-- Name: templates; Type: TABLE; Schema: public; Owner: reports_user
--

CREATE TABLE public.templates (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    questions jsonb NOT NULL,
    is_student_tracker boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by bigint
);


ALTER TABLE public.templates OWNER TO reports_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: reports_user
--

CREATE TABLE public.users (
    telegram_id bigint NOT NULL,
    first_name text NOT NULL,
    last_name text,
    username text,
    photo_url text,
    team_id uuid,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO reports_user;

--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: reports_user
--

COPY public.reports (id, user_id, team_id, template_id, title, answers, template_data, created_at) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: reports_user
--

COPY public.teams (id, name, description, template_id, created_at, created_by) FROM stdin;
8dd50754-48ac-4b02-803a-c71d624027bf	Test		\N	2026-03-18 01:36:56.040594+00	6520664733
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: reports_user
--

COPY public.templates (id, name, description, questions, is_student_tracker, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: reports_user
--

COPY public.users (telegram_id, first_name, last_name, username, photo_url, team_id, role, created_at) FROM stdin;
6520664733	Shahriyor		YuldShah	https://t.me/i/userpic/320/P4UlvJsADiwx7pgymjiFe1K9dPdiUQZOK5sEQtY1Wk_MGxlSoYwFhUBje8Z0tvoG.svg	\N	admin	2026-03-18 00:53:32.318909+00
7079607349	GB			https://t.me/i/userpic/320/wGekPEPB1PA0rzriJvpcIF0a8jmEYjInociSvMIkYFYX7459RWWwbUaalV6CnpXz.svg	\N	employee	2026-03-18 01:20:09.019492+00
999999	Browser	Debug	browser_debug	\N	\N	employee	2026-03-18 01:36:27.023111+00
\.


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (telegram_id);


--
-- Name: idx_reports_created_at; Type: INDEX; Schema: public; Owner: reports_user
--

CREATE INDEX idx_reports_created_at ON public.reports USING btree (created_at);


--
-- Name: idx_reports_team_id; Type: INDEX; Schema: public; Owner: reports_user
--

CREATE INDEX idx_reports_team_id ON public.reports USING btree (team_id);


--
-- Name: idx_reports_template_id; Type: INDEX; Schema: public; Owner: reports_user
--

CREATE INDEX idx_reports_template_id ON public.reports USING btree (template_id);


--
-- Name: idx_reports_user_id; Type: INDEX; Schema: public; Owner: reports_user
--

CREATE INDEX idx_reports_user_id ON public.reports USING btree (user_id);


--
-- Name: idx_teams_template_id; Type: INDEX; Schema: public; Owner: reports_user
--

CREATE INDEX idx_teams_template_id ON public.teams USING btree (template_id);


--
-- Name: idx_users_team_id; Type: INDEX; Schema: public; Owner: reports_user
--

CREATE INDEX idx_users_team_id ON public.users USING btree (team_id);


--
-- Name: reports reports_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: reports reports_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id);


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(telegram_id);


--
-- Name: teams teams_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(telegram_id);


--
-- Name: teams teams_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id);


--
-- Name: templates templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reports_user
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(telegram_id);


--
-- PostgreSQL database dump complete
--

