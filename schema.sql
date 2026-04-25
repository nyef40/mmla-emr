--
-- PostgreSQL database dump
--

\restrict hg8Ogpyq9zmZWSak0L5Yct2nTFjg4liBbQgVyiIwMVBToFtDhLhl8pqJJdUVRmZ

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

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

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: mmla
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO mmla;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: mmla
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO mmla;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: mmla
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO mmla;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: mmla
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO mmla;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO mmla;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    appointment_id text NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer,
    appointment_type text NOT NULL,
    status text DEFAULT 'scheduled'::text,
    scheduled_for timestamp without time zone NOT NULL,
    duration integer DEFAULT 30,
    reason text,
    notes text,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.appointments OWNER TO mmla;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO mmla;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    table_name character varying(50),
    record_id integer,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_log OWNER TO mmla;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_id_seq OWNER TO mmla;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.audit_log_id_seq OWNED BY public.audit_log.id;


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.medical_records (
    id integer NOT NULL,
    record_id text NOT NULL,
    patient_id integer NOT NULL,
    visit_date timestamp without time zone NOT NULL,
    doctor_id integer,
    diagnosis text,
    symptoms text,
    treatment text,
    prescription json,
    vital_signs json,
    lab_results json,
    notes text,
    follow_up_date timestamp without time zone,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.medical_records OWNER TO mmla;

--
-- Name: medical_records_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.medical_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medical_records_id_seq OWNER TO mmla;

--
-- Name: medical_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.medical_records_id_seq OWNED BY public.medical_records.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.patients (
    id integer NOT NULL,
    patient_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    date_of_birth timestamp without time zone NOT NULL,
    gender text NOT NULL,
    phone text,
    email text,
    address text,
    emergency_contact json,
    blood_type text,
    allergies text,
    medical_conditions text,
    medications text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    owner_id integer NOT NULL
);


ALTER TABLE public.patients OWNER TO mmla;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_id_seq OWNER TO mmla;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.prescriptions (
    id integer NOT NULL,
    prescription_id text NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    medication_name text NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    instructions text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    refills integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prescriptions OWNER TO mmla;

--
-- Name: prescriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.prescriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prescriptions_id_seq OWNER TO mmla;

--
-- Name: prescriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.prescriptions_id_seq OWNED BY public.prescriptions.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_token text NOT NULL,
    expires timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    ip_address text,
    user_agent text
);


ALTER TABLE public.sessions OWNER TO mmla;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO mmla;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text,
    is_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    password text,
    role text DEFAULT 'staff'::text,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO mmla;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: mmla
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO mmla;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mmla
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: mmla
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO mmla;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: mmla
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: audit_log id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN id SET DEFAULT nextval('public.audit_log_id_seq'::regclass);


--
-- Name: medical_records id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.medical_records ALTER COLUMN id SET DEFAULT nextval('public.medical_records_id_seq'::regclass);


--
-- Name: patients id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Name: prescriptions id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.prescriptions ALTER COLUMN id SET DEFAULT nextval('public.prescriptions_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: mmla
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_appointment_id_unique; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_appointment_id_unique UNIQUE (appointment_id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_record_id_unique; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_record_id_unique UNIQUE (record_id);


--
-- Name: patients patients_patient_id_unique; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_id_unique UNIQUE (patient_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_prescription_id_unique; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_prescription_id_unique UNIQUE (prescription_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_session_token_unique; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_session_token_unique UNIQUE (session_token);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_token_unique UNIQUE (token);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: mmla
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at);


--
-- Name: idx_audit_log_user_id; Type: INDEX; Schema: public; Owner: mmla
--

CREATE INDEX idx_audit_log_user_id ON public.audit_log USING btree (user_id);


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: patients patients_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: mmla
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict hg8Ogpyq9zmZWSak0L5Yct2nTFjg4liBbQgVyiIwMVBToFtDhLhl8pqJJdUVRmZ

