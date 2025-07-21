-- Create storage bucket for dispute evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('dispute-evidence', 'dispute-evidence', false);

-- Create policies for dispute evidence storage
CREATE POLICY "Users can upload evidence for their disputes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'dispute-evidence' AND 
  EXISTS (
    SELECT 1 FROM disputes 
    WHERE (filed_by = auth.uid() OR respondent_id = auth.uid())
    AND id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can view evidence for their disputes" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'dispute-evidence' AND 
  (
    EXISTS (
      SELECT 1 FROM disputes 
      WHERE (filed_by = auth.uid() OR respondent_id = auth.uid())
      AND id::text = (storage.foldername(name))[1]
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND user_role IN ('admin', 'moderator')
    )
  )
);

CREATE POLICY "Admins can manage all dispute evidence" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'dispute-evidence' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND user_role IN ('admin', 'moderator')
  )
);