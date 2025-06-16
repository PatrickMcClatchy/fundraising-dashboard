-- Update existing campaign to German version
UPDATE campaigns 
SET 
  name = 'Direktkredit-Kampagne Ausbau',
  description = 'Unterstützt unsere Direktkredit-Kampagne für den Ausbau!'
WHERE id = (SELECT id FROM campaigns LIMIT 1);

-- Update any existing donations to use Euro terminology in logs if needed
-- (The actual amounts stay the same, just display changes)
