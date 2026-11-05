ALTER TABLE public.quote_requests ADD COLUMN client_ip text;
COMMENT ON COLUMN public.quote_requests.client_ip IS 'IP of submitter, used for spam rate limiting';