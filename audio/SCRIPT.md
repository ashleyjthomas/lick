# LICK-4 narration script

Record each line at moderate volume in a quiet room. Save as 44.1 kHz MP3 (or WAV --- I'll convert).

Drop the recordings into `audio/` with **exactly** the filename in the header. The study will pick them up automatically.

A few conventions: - The protagonist's name and the relationship label are baked into each trial file. - Speak naturally; aim for \~1 second between phrases so the audio paces with the video animation. - The "[...]" markers below indicate suggested short pauses inside a single recording --- don't say the word "pause".

------------------------------------------------------------------------

## Intro screens (2 files)

These play once at the start of the study, depending on the assigned relationship.

### `intro_mom.mp3`

> In this study, you'll watch some short videos of girls with their moms. After each video, I'll ask you a few questions.

### `intro_teacher.mp3`

> In this study, you'll watch some short videos of girls with their teachers. After each video, I'll ask you a few questions.

------------------------------------------------------------------------

## Trial narrations (12 files)

These play in sync with each trial video. Aim for the narration to span the full video duration (10--22 seconds).

### `narration_pro_pres_mom.mp3` (Jane, prosocial, present, mom)

> Here's Jane. The person standing next to Jane is **Jane's mom**. [...] The wind knocks over Jane's kazoo. [...] Jane's mom puts it back. [...] Jane plays her kazoo again.

### `narration_pro_pres_teacher.mp3` (Jane, prosocial, present, teacher)

> Here's Jane. The person standing next to Jane is **Jane's teacher**. [...] The wind knocks over Jane's kazoo. [...] Jane's teacher puts it back. [...] Jane plays her kazoo again.

### `narration_pro_abs_mom.mp3` (Jasmine, prosocial, absent, mom)

> Here's Jasmine. The person standing next to Jasmine is **Jasmine's mom**. [...] Jasmine leaves. [...] The wind knocks over Jasmine's kazoo. [...] Jasmine's mom puts it back. [...] Jasmine comes back and plays her kazoo again.

### `narration_pro_abs_teacher.mp3` (Jasmine, prosocial, absent, teacher)

> Here's Jasmine. The person standing next to Jasmine is **Jasmine's teacher**. [...] Jasmine leaves. [...] The wind knocks over Jasmine's kazoo. [...] Jasmine's teacher puts it back. [...] Jasmine comes back and plays her kazoo again.

### `narration_sal_pres_mom.mp3` (Jocelyn, saliva, present, mom)

> Here's Jocelyn. The person standing next to Jocelyn is **Jocelyn's mom**. [...] Jocelyn gives her kazoo to her mom. [...] Her mom plays Jocelyn's kazoo. [...] She gives it back, and Jocelyn plays her kazoo again.

### `narration_sal_pres_teacher.mp3` (Jocelyn, saliva, present, teacher)

> Here's Jocelyn. The person standing next to Jocelyn is **Jocelyn's teacher**. [...] Jocelyn gives her kazoo to her teacher. [...] Her teacher plays Jocelyn's kazoo. [...] She gives it back, and Jocelyn plays her kazoo again.

### `narration_sal_abs_mom.mp3` (Jenny, saliva, absent, mom)

> Here's Jenny. The person standing next to Jenny is **Jenny's mom**. [...] Jenny leaves. [...] While Jenny is gone, Jenny's mom plays Jenny's kazoo. [...] Jenny comes back and plays her kazoo again.

### `narration_sal_abs_teacher.mp3` (Jenny, saliva, absent, teacher)

> Here's Jenny. The person standing next to Jenny is **Jenny's teacher**. [...] Jenny leaves. [...] While Jenny is gone, Jenny's teacher plays Jenny's kazoo. [...] Jenny comes back and plays her kazoo again.

### `narration_tch_pres_mom.mp3` (Jada, touch, present, mom)

> Here's Jada. The person standing next to Jada is **Jada's mom**. [...] Jada gives her drumstick to her mom. [...] Her mom uses Jada's drumstick. [...] She gives it back, and Jada uses her drumstick again.

### `narration_tch_pres_teacher.mp3` (Jada, touch, present, teacher)

> Here's Jada. The person standing next to Jada is **Jada's teacher**. [...] Jada gives her drumstick to her teacher. [...] Her teacher uses Jada's drumstick. [...] She gives it back, and Jada uses her drumstick again.

### `narration_tch_abs_mom.mp3` (Julia, touch, absent, mom)

> Here's Julia. The person standing next to Julia is **Julia's mom**. [...] Julia leaves. [...] While Julia is gone, Julia's mom uses Julia's drumstick. [...] Julia comes back and uses her drumstick again.

### `narration_tch_abs_teacher.mp3` (Julia, touch, absent, teacher)

> Here's Julia. The person standing next to Julia is **Julia's teacher**. [...] Julia leaves. [...] While Julia is gone, Julia's teacher uses Julia's drumstick. [...] Julia comes back and uses her drumstick again.

------------------------------------------------------------------------

## Question prompts (generic across trials)

### `q_memory_play.mp3` (for Saliva trials)

> Did she play her own kazoo, or someone else's kazoo?

### `q_memory_use.mp3` (for Touch trials)

> Did she use her own drumstick, or someone else's drumstick?

### `q_memory_touch.mp3` (for Prosocial trials)

> Did she touch her own kazoo, or someone else's kazoo?

### `q_okay.mp3`

> Did she do something that was okay?

### `q_certainty.mp3`

> How sure are you?

### `q_protagonist_okay.mp3` (Absent trials only)

> Would the girl think it was okay if she found out?

### `q_attention.mp3`

> Who is the person standing next to her?

------------------------------------------------------------------------

## Attention-check screens

### `attention_intro_mom.mp3` (start-of-study check for the Mom condition)

> Just to check: in every video you watch today, the person next to the girl is her **mom**. Can you remember that?

### `attention_intro_teacher.mp3` (start-of-study check for the Teacher condition)

> Just to check: in every video you watch today, the person next to the girl is her **teacher**. Can you remember that?

------------------------------------------------------------------------

## Outro

### `thanks.mp3`

> Thank you for playing! All done.
