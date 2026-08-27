CREATE OR REPLACE FUNCTION prevent_duplicate_review_for_work()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Lock the parent work row so concurrent requests for the same work serialize.
  PERFORM id FROM works WHERE id = NEW.work_id FOR UPDATE;

  IF EXISTS (SELECT 1 FROM reviews WHERE work_id = NEW.work_id) THEN
    RAISE EXCEPTION 'A review for work % already exists', NEW.work_id
      USING ERRCODE = '23505',
            CONSTRAINT = 'reviews_one_per_work';
  END IF;

  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS reviews_prevent_duplicate ON reviews;

CREATE TRIGGER reviews_prevent_duplicate
BEFORE INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_review_for_work();
