import re
import json

with open('/Users/ahmadtubaishat/.gemini/antigravity/scratch/teacher-tracking/pdf_text.txt', 'r', encoding='utf-8') as f:
    text = f.read()

clean_text = re.sub(r'[\u200e\u200f\u202a-\u202e]', '', text)

start = clean_text.find('تقرير كل معلم')
end = clean_text.find('مراجع بيانات المعلمين المشمولين')
cards_text = clean_text[start:end]

ref_names = [
    'ابراهيم حلمى ابراهيم جمعه',
    'احمد اسامه صقر المعاني',
    'اشرف صالح محمد فدعوس',
    'الحسن علي محمد علي',
    'امجد سهيل عزيز',
    'امداد علي',
    'انس عبدالكريم موسى جرادات',
    'اياد أحمد سلمان عبدالقادر',
    'جعفر ياشلي',
    'حجيباهلل خاسييف',
    'حسام حامد علي البنوي',
    'خالد عصام بارودي',
    'راجي ترابي',
    'زكي أحمد خالد',
    'زوكير عبدالرحمانوف',
    'سمير بلفقي',
    'سيد علي هايدور',
    'سيد مصطفى السيد سليمان',
    'شاكيل احمد رفيق',
    'ضرار حسن صادق مالح',
    'طاهر كمال عبدهللا الحلو',
    'عبدالعزيز محمد',
    'عبدالغني عبيده',
    'عالء حسني محمد موسى',
    'على سالم على سالمين الصيعري',
    'عمران كاشف محمد حسين اسد',
    'فتحي المنجي بلحاج صالح',
    'فيصل محمد مسلم الحضري',
    'كريم ولجي',
    'كليفرد جورج بايلي',
    'محمد سامي ابراهيم عبدالقادر الكفرى',
    'محمد سيد ميردادي',
    'محمد شفاتا احمد',
    'محمد عادل عبدالعزيز الطاهر',
    'محمد عالءالدين محمد عوض هللا',
    'محمد عماد ازكول',
    'محمد عيسي دادي',
    'محمد قاسم',
    'محمد كمال محمد زيد',
    'محمد ورسامي عمر',
    'ناصر احمد حسن حلوة',
    'نزار بن عبدهللا حاجي',
    'هشام محمد امام سليمان'
]

admin_ratings_map = {
    # 7 ممتاز
    'ابراهيم عونى عمر حسن النعيمى': ('ممتاز', 'تقدير إداري للمهندسين والمختبرات التخصصية'),
    'انس عبدالكريم موسى جرادات': ('ممتاز', 'تقدير إداري للمهندسين والمختبرات التخصصية'),
    'اياد أحمد سلمان عبدالقادر': ('ممتاز', 'تقدير إداري للمهندسين والمختبرات التخصصية'),
    'اياد محمود علي سالمه': ('ممتاز', 'تقدير إداري للمهندسين والمختبرات التخصصية'),
    'عبدالعزيز محمد': ('ممتاز', 'تقدير إداري للمهندسين والمختبرات التخصصية'),
    'على سالم على سالمين الصيعري': ('ممتاز', 'تقدير إداري للمهندسين والمختبرات التخصصية'),
    'محمود علم اقبال احمد': ('ممتاز', 'تقدير إداري للمهندسين والمختبرات التخصصية'),
    # 21 جيد جداً
    'احمد اسامه صقر المعاني': ('جيد جداً', 'تقدير إداري لمعلمي مادة التصميم التكنولوجي وفق اعتماد الإدارة'),
    'محمد شفاتا احمد': ('جيد جداً', 'تقدير إداري لمعلمي مادة التصميم التكنولوجي وفق اعتماد الإدارة'),
    'اوزدن اوزغور': ('جيد جداً', 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة'),
    'ايلفيس ايلوم تيتي': ('جيد جداً', 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة'),
    'زايد كاظم': ('جيد جداً', 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة'),
    'سليمان ميا': ('جيد جداً', 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة'),
    'فوزي عصام بو فخرالدين': ('جيد جداً', 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة'),
    'نبيل صالح الدين عطيه ايوب': ('جيد جداً', 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة'),
    'حجيباهلل خاسييف': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'زكي أحمد خالد': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'زوكير عبدالرحمانوف': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'سيد علي هايدور': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'شاكيل احمد رفيق': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'طاهر كمال عبدهللا الحلو': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'عبدالغني عبيده': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'عالء حسني محمد موسى': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'كريم ولجي': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'محمد كمال محمد زيد': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'ناصر احمد حسن حلوة': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'نزار بن عبدهللا حاجي': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
    'هشام محمد امام سليمان': ('جيد جداً', 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة'),
}

top10_dict = {
    'ابراهيم حلمى ابراهيم جمعه': {'rank': 1, 'generalIndex': 95.00, 'evalIndex': 100.00, 'lessonsIndex': 90.00},
    'سيد مصطفى السيد سليمان': {'rank': 2, 'generalIndex': 94.35, 'evalIndex': 100.00, 'lessonsIndex': 88.70},
    'سمير بلفقي': {'rank': 3, 'generalIndex': 92.86, 'evalIndex': 100.00, 'lessonsIndex': 85.71},
    'محمد عادل عبدالعزيز الطاهر': {'rank': 4, 'generalIndex': 89.29, 'evalIndex': 90.00, 'lessonsIndex': 88.57},
    'ناصر احمد حسن حلوة': {'rank': 5, 'generalIndex': 85.57, 'evalIndex': 84.21, 'lessonsIndex': 86.94},
    'الحسن علي محمد علي': {'rank': 6, 'generalIndex': 81.25, 'evalIndex': 100.00, 'lessonsIndex': 62.50},
    'عمران كاشف محمد حسين اسد': {'rank': 7, 'generalIndex': 80.00, 'evalIndex': 100.00, 'lessonsIndex': 60.00},
    'انس عبدالكريم موسى جرادات': {'rank': 8, 'generalIndex': 76.25, 'evalIndex': 92.50, 'lessonsIndex': 60.00},
    'خالد عصام بارودي': {'rank': 9, 'generalIndex': 74.23, 'evalIndex': 88.46, 'lessonsIndex': 60.00},
    'امداد علي': {'rank': 10, 'generalIndex': 74.00, 'evalIndex': 88.00, 'lessonsIndex': 60.00},
}

dept_map = {
    'ابراهيم حلمى ابراهيم جمعه': 'اللغة العربية',
    'احمد اسامه صقر المعاني': 'التصميم التكنولوجي',
    'اشرف صالح محمد فدعوس': 'STEM',
    'الحسن علي محمد علي': 'التربية الإسلامية',
    'امجد سهيل عزيز': 'STEM',
    'امداد علي': 'الحاسوب',
    'انس عبدالكريم موسى جرادات': 'مختبر الطاقة',
    'اياد أحمد سلمان عبدالقادر': 'مختبر التصنيع الرقمي',
    'جعفر ياشلي': 'الرياضيات',
    'حجيباهلل خاسييف': 'STEM',
    'حسام حامد علي البنوي': 'التربية الإسلامية',
    'خالد عصام بارودي': 'الحاسوب',
    'راجي ترابي': 'STEM',
    'زكي أحمد خالد': 'STEM',
    'زوكير عبدالرحمانوف': 'STEM',
    'سمير بلفقي': 'اللغة العربية',
    'سيد علي هايدور': 'STEM',
    'سيد مصطفى السيد سليمان': 'اللغة العربية',
    'شاكيل احمد رفيق': 'STEM',
    'ضرار حسن صادق مالح': 'STEM',
    'طاهر كمال عبدهللا الحلو': 'التربية البدنية',
    'عبدالعزيز محمد': 'المختبرات التخصصية',
    'عبدالغني عبيده': 'الرياضيات',
    'عالء حسني محمد موسى': 'التربية الإسلامية',
    'على سالم على سالمين الصيعري': 'مختبر التصنيع الرقمي',
    'عمران كاشف محمد حسين اسد': 'STEM',
    'فتحي المنجي بلحاج صالح': 'التربية البدنية',
    'فيصل محمد مسلم الحضري': 'الدراسات الاجتماعية',
    'كريم ولجي': 'STEM',
    'كليفرد جورج بايلي': 'الرياضيات',
    'محمد سامي ابراهيم عبدالقادر الكفرى': 'الحاسوب',
    'محمد سيد ميردادي': 'اللغة الإنجليزية',
    'محمد شفاتا احمد': 'التصميم التكنولوجي',
    'محمد عادل عبدالعزيز الطاهر': 'اللغة العربية',
    'محمد عالءالدين محمد عوض هللا': 'التربية البدنية',
    'محمد عماد ازكول': 'الرياضيات',
    'محمد عيسي دادي': 'اللغة الإنجليزية',
    'محمد قاسم': 'الرياضيات',
    'محمد كمال محمد زيد': 'الرياضيات',
    'محمد ورسامي عمر': 'اللغة الإنجليزية',
    'ناصر احمد حسن حلوة': 'التربية الإسلامية',
    'نزار بن عبدهللا حاجي': 'STEM',
    'هشام محمد امام سليمان': 'اللغة العربية',
    # 9 without activity
    'ابراهيم عونى عمر حسن النعيمى': 'مختبر الطاقة',
    'اوزدن اوزغور': 'STEM',
    'اياد محمود علي سالمه': 'مختبر الروبوت',
    'ايلفيس ايلوم تيتي': 'اللغة الإنجليزية',
    'زايد كاظم': 'STEM',
    'سليمان ميا': 'STEM',
    'فوزي عصام بو فخرالدين': 'STEM',
    'محمود علم اقبال احمد': 'مختبر الروبوت',
    'نبيل صالح الدين عطيه ايوب': 'STEM',
}

positions = []
for name in ref_names:
    pos = cards_text.find(name)
    positions.append((pos, name))
positions.sort()

teachers = []

for i in range(len(positions)):
    pos, name = positions[i]
    next_pos = positions[i+1][0] if i+1 < len(positions) else len(cards_text)
    chunk = cards_text[pos:next_pos]
    
    # sectionsCount
    sec_m = re.search(r'(\d+)\s*سجالت مادة وشعبة', chunk)
    sections_count = int(sec_m.group(1)) if sec_m else 0
    
    # subjectsAndSections
    subj_m = re.search(r'المواد والشعب\s*\n+([^\n]+(?:\n+[^\n]+)*?)(?=\n+تغطية التقييمات|\n+المؤشر|\n+\d+/62)', chunk)
    subjects = subj_m.group(1).replace('\n', ' ').strip() if subj_m else ''
    
    # evalCoverage
    eval_cov_m = re.search(r'تغطية التقييمات\s*\n+([^\n]+)', chunk)
    eval_cov_str = eval_cov_m.group(1).strip() if eval_cov_m else ''
    ratio_m = re.search(r'(\d+\s*/\s*\d+)', eval_cov_str)
    ratio_str = ratio_m.group(1).replace(' ', '') if ratio_m else '0/0'
    pct_m = re.search(r'([\d\.]+)٪', eval_cov_str)
    eval_pct = float(pct_m.group(1)) if pct_m else 0.0
    
    # eval numbers (مرفوعة / مسندة / غير مسندة)
    eval_nums = re.search(r'التقييمات\s*:\s*مرفوعة\s*/\s*مسندة\s*/\s*غير مسندة\s*\n+([\d\s/]+)', chunk)
    if eval_nums:
        nums = [int(x.strip()) for x in eval_nums.group(1).split('/') if x.strip().isdigit()]
        up = nums[0] if len(nums) > 0 else 0
        ass = nums[1] if len(nums) > 1 else 0
        unass = nums[2] if len(nums) > 2 else 0
    else:
        up, ass, unass = 0, 0, 0
        
    # submissions (مستلمة / مصححة / معلقة)
    sub_nums = re.search(r'التسليمات\s*:\s*مستلمة\s*/\s*مصححة\s*/\s*معلقة\s*\n+([\d\s/]+)', chunk)
    if sub_nums:
        nums = [int(x.strip()) for x in sub_nums.group(1).split('/') if x.strip().isdigit()]
        sub_rec = nums[0] if len(nums) > 0 else 0
        sub_grd = nums[1] if len(nums) > 1 else 0
        sub_pnd = nums[2] if len(nums) > 2 else 0
    else:
        sub_rec, sub_grd, sub_pnd = 0, 0, 0
        
    # solve / grading rates
    rates_m = re.search(r'نسبة الحل\s*/\s*التصحيح\s*\n+([^\n]+)', chunk)
    solve_rate = 0.0
    grading_rate = 0.0
    if rates_m:
        r_line = rates_m.group(1).strip()
        pcts = re.findall(r'([\d\.]+)٪', r_line)
        if len(pcts) >= 2:
            grading_rate = float(pcts[0]) if float(pcts[0]) <= 100 else 0.0
            solve_rate = float(pcts[1]) if len(pcts) > 1 else 0.0
        elif len(pcts) == 1:
            grading_rate = float(pcts[0])
            
    # lessons (مرفوعة / ظاهرة / مخفية)
    les_nums = re.search(r'الدروس\s*:\s*مرفوعة\s*/\s*ظاهرة\s*/\s*مخفية\s*\n+([\d\s/]+)', chunk)
    if les_nums:
        nums = [int(x.strip()) for x in les_nums.group(1).split('/') if x.strip().isdigit()]
        les_up = nums[0] if len(nums) > 0 else 0
        les_vis = nums[1] if len(nums) > 1 else 0
        les_hid = nums[2] if len(nums) > 2 else 0
    else:
        les_up, les_vis, les_hid = 0, 0, 0
        
    # lessons valid
    val_m = re.search(r'الدروس المحسوبة وفق شروط المصدر\s*\n+([^\n]+)', chunk)
    les_val = 0
    les_val_pct = 0.0
    if val_m:
        val_line = val_m.group(1).strip()
        p_match = re.search(r'([\d\.]+)٪', val_line)
        if p_match:
            les_val_pct = float(p_match.group(1))
        num_match = re.search(r'(\d+)\s*/\s*\d+', val_line)
        if num_match:
            les_val = int(num_match.group(1))

    # missing eval records
    missing_eval_m = re.search(r'السجالت غير الظاهرة في ملف التقييمات\s*\n+([^\n]+(?:\n+[^\n]+)*?)(?=\n+سجالت بال دروس|\n+\d+/62)', chunk)
    missing_eval = missing_eval_m.group(1).replace('\n', ' ').strip() if missing_eval_m else 'ال يوجد'

    # missing lesson records
    missing_les_m = re.search(r'سجالت بال دروس\s*\n+([^\n]+(?:\n+[^\n]+)*?)(?=\n+\.html|\n+تقرير تقييم|\n+\d+/62)', chunk)
    missing_les = missing_les_m.group(1).replace('\n', ' ').strip() if missing_les_m else 'ال يوجد'

    # notes
    lines = [l.strip() for l in chunk.split('\n') if l.strip()]
    m_idx = -1
    for idx, l in enumerate(lines):
        if l == 'المؤشر':
            m_idx = idx
            break
    
    note_lines = []
    if m_idx != -1:
        for l in lines[1:m_idx]:
            if not re.match(r'^(\d+|\d+/\d+|\d+٪|التقييمات|الدروس|التصحيح|\d+/\d+|\d+سجالت.*)$', l):
                if not 'file:///' in l and not 'تقرير تقييم' in l and not '9/20/26' in l:
                    note_lines.append(l)
    note_text = ' '.join(note_lines).strip()
    if not note_text:
        note_text = 'متابعة النشاط على المنصة وفق المؤشرات المعتمدة.'

    # Badges and categories
    badges = []
    category = 'top_aspect'
    
    if name in top10_dict:
        t_info = top10_dict[name]
        badges.append(f"المركز {t_info['rank']} في المؤشر العام 🏆")
        category = 'top_overall'
        
    if name in admin_ratings_map:
        rating, basis = admin_ratings_map[name]
        badges.append(f"التقدير المعتمد: {rating} 🎖️")
    else:
        rating, basis = 'لا يوجد تعديل إداري', ''

    if grading_rate == 100.0 and sub_rec > 0:
        badges.append(f"تصحيح 100% ({sub_grd}/{sub_rec})")
    elif sub_pnd > 0:
        badges.append(f"{sub_pnd} تسليم بانتظار التصحيح ⏳")
        if category != 'top_overall':
            category = 'followup_pending'

    if eval_pct == 100.0:
        badges.append("تغطية تقييمات كاملة 100%")
    elif eval_pct > 0:
        badges.append(f"تغطية تقييمات جزئية {eval_pct}%")
        if category not in ['top_overall', 'followup_pending']:
            category = 'followup_partial'
    else:
        badges.append("لا توجد تقييمات مسجلة")
        if category not in ['top_overall', 'followup_pending']:
            category = 'followup_no_eval'

    if les_up > 0:
        badges.append(f"{les_up} درساً مسجلاً")

    t_obj = {
        'id': f'lms_t{i+1}',
        'name': name,
        'department': dept_map.get(name, 'عام'),
        'sectionsCount': sections_count,
        'subjectsAndSections': subjects,
        'evalCoverageRatio': ratio_str,
        'evalCoveragePercent': eval_pct,
        'evalUploaded': up,
        'evalAssigned': ass,
        'evalUnassigned': unass,
        'submissionsReceived': sub_rec,
        'submissionsGraded': sub_grd,
        'submissionsPending': sub_pnd,
        'solveRate': solve_rate,
        'gradingRate': grading_rate,
        'lessonsUploaded': les_up,
        'lessonsVisible': les_vis,
        'lessonsHidden': les_hid,
        'lessonsValid': les_val,
        'lessonsValidPercent': les_val_pct,
        'missingEvalRecords': missing_eval,
        'missingLessonRecords': missing_les,
        'notes': note_text,
        'category': category,
        'badges': badges,
        'adminRating': rating,
        'adminRatingBasis': basis,
        'hasActivityData': True
    }
    
    if name in top10_dict:
        t_obj['generalIndex'] = top10_dict[name]['generalIndex']
        t_obj['evalIndex'] = top10_dict[name]['evalIndex']
        t_obj['lessonsIndex'] = top10_dict[name]['lessonsIndex']

    teachers.append(t_obj)

# Add the 9 teachers without activity data
no_activity_teachers = [
    {
        'id': 'lms_t44',
        'name': 'ابراهيم عونى عمر حسن النعيمى',
        'department': 'مختبر الطاقة',
        'sectionsCount': 0,
        'subjectsAndSections': 'مختبر الطاقة التخصصي',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: ممتاز في الدروس وممتاز في التقييمات. تقدير إداري للمهندسين والمختبرات التخصصية.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: ممتاز 🎖️', 'مهندس مختبر تخصصي'],
        'adminRating': 'ممتاز',
        'adminRatingBasis': 'تقدير إداري للمهندسين والمختبرات التخصصية',
        'hasActivityData': False
    },
    {
        'id': 'lms_t45',
        'name': 'اياد محمود علي سالمه',
        'department': 'مختبر الروبوت',
        'sectionsCount': 0,
        'subjectsAndSections': 'مختبر الروبوت التخصصي',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: ممتاز في الدروس وممتاز في التقييمات. تقدير إداري للمهندسين والمختبرات التخصصية.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: ممتاز 🎖️', 'مهندس مختبر تخصصي'],
        'adminRating': 'ممتاز',
        'adminRatingBasis': 'تقدير إداري للمهندسين والمختبرات التخصصية',
        'hasActivityData': False
    },
    {
        'id': 'lms_t46',
        'name': 'محمود علم اقبال احمد',
        'department': 'مختبر الروبوت',
        'sectionsCount': 0,
        'subjectsAndSections': 'مختبر الروبوت التخصصي',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: ممتاز في الدروس وممتاز في التقييمات. تقدير إداري للمهندسين والمختبرات التخصصية.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: ممتاز 🎖️', 'مهندس مختبر تخصصي'],
        'adminRating': 'ممتاز',
        'adminRatingBasis': 'تقدير إداري للمهندسين والمختبرات التخصصية',
        'hasActivityData': False
    },
    {
        'id': 'lms_t47',
        'name': 'اوزدن اوزغور',
        'department': 'STEM',
        'sectionsCount': 0,
        'subjectsAndSections': 'STEM',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: جيد جداً في الدروس وجيد جداً في التقييمات. تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: جيد جداً 🎖️', 'ضمن نطاق التقرير الإداري'],
        'adminRating': 'جيد جداً',
        'adminRatingBasis': 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة',
        'hasActivityData': False
    },
    {
        'id': 'lms_t48',
        'name': 'ايلفيس ايلوم تيتي',
        'department': 'اللغة الإنجليزية',
        'sectionsCount': 0,
        'subjectsAndSections': 'اللغة الإنجليزية',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: جيد جداً في الدروس وجيد جداً في التقييمات. تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: جيد جداً 🎖️', 'ضمن نطاق التقرير الإداري'],
        'adminRating': 'جيد جداً',
        'adminRatingBasis': 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة',
        'hasActivityData': False
    },
    {
        'id': 'lms_t49',
        'name': 'زايد كاظم',
        'department': 'STEM',
        'sectionsCount': 0,
        'subjectsAndSections': 'STEM',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: جيد جداً في الدروس وجيد جداً في التقييمات. تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: جيد جداً 🎖️', 'ضمن نطاق التقرير الإداري'],
        'adminRating': 'جيد جداً',
        'adminRatingBasis': 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة',
        'hasActivityData': False
    },
    {
        'id': 'lms_t50',
        'name': 'سليمان ميا',
        'department': 'STEM',
        'sectionsCount': 0,
        'subjectsAndSections': 'STEM',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: جيد جداً في الدروس وجيد جداً في التقييمات. تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: جيد جداً 🎖️', 'ضمن نطاق التقرير الإداري'],
        'adminRating': 'جيد جداً',
        'adminRatingBasis': 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة',
        'hasActivityData': False
    },
    {
        'id': 'lms_t51',
        'name': 'فوزي عصام بو فخرالدين',
        'department': 'STEM',
        'sectionsCount': 0,
        'subjectsAndSections': 'STEM',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: جيد جداً في الدروس وجيد جداً في التقييمات. تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: جيد جداً 🎖️', 'ضمن نطاق التقرير الإداري'],
        'adminRating': 'جيد جداً',
        'adminRatingBasis': 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة',
        'hasActivityData': False
    },
    {
        'id': 'lms_t52',
        'name': 'نبيل صالح الدين عطيه ايوب',
        'department': 'STEM',
        'sectionsCount': 0,
        'subjectsAndSections': 'STEM',
        'evalCoverageRatio': '0/0',
        'evalCoveragePercent': 0,
        'evalUploaded': 0,
        'evalAssigned': 0,
        'evalUnassigned': 0,
        'submissionsReceived': 0,
        'submissionsGraded': 0,
        'submissionsPending': 0,
        'solveRate': 0,
        'gradingRate': 0,
        'lessonsUploaded': 0,
        'lessonsVisible': 0,
        'lessonsHidden': 0,
        'lessonsValid': 0,
        'lessonsValidPercent': 0,
        'missingEvalRecords': 'لا تظهر سجلات في ملفي النشاط',
        'missingLessonRecords': 'لا تظهر سجلات في ملفي النشاط',
        'notes': 'التقدير المعتمد: جيد جداً في الدروس وجيد جداً في التقييمات. تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة.',
        'category': 'top_aspect',
        'badges': ['التقدير المعتمد: جيد جداً 🎖️', 'ضمن نطاق التقرير الإداري'],
        'adminRating': 'جيد جداً',
        'adminRatingBasis': 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة',
        'hasActivityData': False
    },
]

teachers.extend(no_activity_teachers)

print(f'Total teachers generated: {len(teachers)}')

# Now build the TypeScript file content
ts_content = f'''// ============================================================================
// Official Qatar Education System (LMS) Teacher Activity Report - September 2026
// تقرير تقييم المعلمين - مراجعة النشاط على المنصة - سبتمبر 2026
// تاريخ الإعداد: 20 سبتمبر 2026 | مدرسة قطر للعلوم والتكنولوجيا الإعدادية الثانوية للبنين
// ============================================================================

export interface LmsReportTeacherRecord {{
  id: string;
  name: string;
  department: string;
  sectionsCount: number;
  subjectsAndSections: string;
  evalCoverageRatio: string;
  evalCoveragePercent: number;
  evalUploaded: number;
  evalAssigned: number;
  evalUnassigned: number;
  submissionsReceived: number;
  submissionsGraded: number;
  submissionsPending: number;
  solveRate: number; // percentage
  gradingRate: number; // percentage
  lessonsUploaded: number;
  lessonsVisible: number;
  lessonsHidden: number;
  lessonsValid: number;
  lessonsValidPercent: number;
  missingEvalRecords: string;
  missingLessonRecords: string;
  notes: string;
  category: 'top_overall' | 'top_aspect' | 'top_dept' | 'followup_pending' | 'followup_partial' | 'followup_no_eval';
  badges: string[];
  bestInDept?: string;
  rankInLessons?: number;
  rankInGrading?: number;
  adminRating?: 'ممتاز' | 'جيد جداً' | 'لا يوجد تعديل إداري';
  adminRatingBasis?: string;
  evalIndex?: number;
  lessonsIndex?: number;
  generalIndex?: number;
  hasActivityData: boolean;
}}

export const SEPTEMBER_2026_LMS_METRICS = {{
  date: '20 سبتمبر 2026',
  period: 'سبتمبر 2026',
  academicYear: '2026-2027',
  totalStaffCount: 61,
  teachersCount: 52, // داخل نطاق التقرير
  teachersWithActivity: 43,
  teachersWithoutActivity: 9,
  excludedCoordinatorsCount: 9,
  adminRatingsCount: 28, // 7 ممتاز + 21 جيد جداً
  adminRatingsExcellent: 7,
  adminRatingsVeryGood: 21,
  sectionsCount: 19,
  subjectSectionRecords: 188,
  evalCoveragePercent: 43.1, // 81 / 188
  evalCoveredRecords: 81,
  evalMissingRecords: 107,
  teachersCoverageFull: 14,
  teachersCoveragePartial: 9,
  teachersCoverageNone: 20,
  lessonsCoveragePercent: 82.4, // (188 - 33) / 188
  lessonsCoveredRecords: 155,
  zeroLessonRecords: 33,
  totalLessons: 1006,
  lessonsVisible: 581,
  lessonsVisiblePercent: 57.8,
  lessonsHidden: 425,
  lessonsHiddenPercent: 42.2,
  lessonsValid: 629,
  lessonsValidPercent: 62.5,
  totalSubmissions: 1119,
  gradedSubmissions: 875,
  gradingRate: 78.2,
  pendingSubmissions: 244,
  uploadedEvaluations: 147,
  assignedEvaluations: 124,
  unassignedEvaluations: 23,
  evalAssignmentRate: 84.4, // 124 / 147
  weightedSolveRate: 58.1, // 1119 / 1926
  potentialSubmissions: 1926,
}};

export const GRADE_LEVEL_LMS_STATS = [
  {{ grade: 'الصف 7', evalPercent: 57.6, evalRatio: '19 / 33', lessonsPercent: 81.8, lessonsRatio: '27 / 33' }},
  {{ grade: 'الصف 9', evalPercent: 39.4, evalRatio: '13 / 33', lessonsPercent: 81.8, lessonsRatio: '27 / 33' }},
  {{ grade: 'الصف 10', evalPercent: 57.5, evalRatio: '23 / 40', lessonsPercent: 80.0, lessonsRatio: '32 / 40' }},
  {{ grade: 'الصف 11', evalPercent: 42.1, evalRatio: '16 / 38', lessonsPercent: 86.8, lessonsRatio: '33 / 38' }},
  {{ grade: 'الصف 12', evalPercent: 22.7, evalRatio: '10 / 44', lessonsPercent: 81.8, lessonsRatio: '36 / 44' }},
];

export const TOP_10_INDEX_TEACHERS = [
  {{ rank: 1, name: 'ابراهيم حلمى ابراهيم جمعه', department: 'اللغة العربية', generalIndex: 95.00, evalIndex: 100.00, lessonsIndex: 90.00, sectionsCount: 3, adminRating: 'لا يوجد تعديل إداري' }},
  {{ rank: 2, name: 'سيد مصطفى السيد سليمان', department: 'اللغة العربية', generalIndex: 94.35, evalIndex: 100.00, lessonsIndex: 88.70, sectionsCount: 4, adminRating: 'لا يوجد تعديل إداري' }},
  {{ rank: 3, name: 'سمير بلفقي', department: 'اللغة العربية', generalIndex: 92.86, evalIndex: 100.00, lessonsIndex: 85.71, sectionsCount: 3, adminRating: 'لا يوجد تعديل إداري' }},
  {{ rank: 4, name: 'محمد عادل عبدالعزيز الطاهر', department: 'اللغة العربية', generalIndex: 89.29, evalIndex: 90.00, lessonsIndex: 88.57, sectionsCount: 4, adminRating: 'لا يوجد تعديل إداري' }},
  {{ rank: 5, name: 'ناصر احمد حسن حلوة', department: 'التربية الإسلامية', generalIndex: 85.57, evalIndex: 84.21, lessonsIndex: 86.94, sectionsCount: 6, adminRating: 'جيد جداً' }},
  {{ rank: 6, name: 'الحسن علي محمد علي', department: 'التربية الإسلامية', generalIndex: 81.25, evalIndex: 100.00, lessonsIndex: 62.50, sectionsCount: 4, adminRating: 'لا يوجد تعديل إداري' }},
  {{ rank: 7, name: 'عمران كاشف محمد حسين اسد', department: 'STEM', generalIndex: 80.00, evalIndex: 100.00, lessonsIndex: 60.00, sectionsCount: 1, adminRating: 'لا يوجد تعديل إداري' }},
  {{ rank: 8, name: 'انس عبدالكريم موسى جرادات', department: 'مختبر الطاقة', generalIndex: 76.25, evalIndex: 92.50, lessonsIndex: 60.00, sectionsCount: 4, adminRating: 'ممتاز' }},
  {{ rank: 9, name: 'خالد عصام بارودي', department: 'الحاسوب', generalIndex: 74.23, evalIndex: 88.46, lessonsIndex: 60.00, sectionsCount: 4, adminRating: 'لا يوجد تعديل إداري' }},
  {{ rank: 10, name: 'امداد علي', department: 'الحاسوب', generalIndex: 74.00, evalIndex: 88.00, lessonsIndex: 60.00, sectionsCount: 2, adminRating: 'لا يوجد تعديل إداري' }},
];

export const DEPARTMENT_PERFORMANCE_LIST = [
  {{ department: 'اللغة العربية', index: 88.55, evalCoverage: '68.4%', evalRatio: '13 / 19', lessonsCoverage: '100.0%', lessonsRatio: '19 / 19', recordsCount: 19, teachersRatio: '5 / 5', lessonsCount: 368, lessonsShare: '36.6%', evalsCount: 27, evalsShare: '18.4%', topTeacher: 'ابراهيم حلمي / سيد مصطفى / سمير بلفقي' }},
  {{ department: 'التربية الإسلامية', index: 78.67, evalCoverage: '70.6%', evalRatio: '12 / 17', lessonsCoverage: '94.1%', lessonsRatio: '16 / 17', recordsCount: 17, teachersRatio: '4 / 4', lessonsCount: 96, lessonsShare: '9.5%', evalsCount: 32, evalsShare: '21.8%', topTeacher: 'الحسن علي محمد علي' }},
  {{ department: 'مختبر الطاقة', index: 76.25, evalCoverage: '100.0%', evalRatio: '4 / 4', lessonsCoverage: '100.0%', lessonsRatio: '4 / 4', recordsCount: 4, teachersRatio: '1 / 2', lessonsCount: 5, lessonsShare: '0.5%', evalsCount: 4, evalsShare: '2.7%', topTeacher: 'انس عبدالكريم موسى جرادات' }},
  {{ department: 'الدراسات الاجتماعية', index: 72.00, evalCoverage: '100.0%', evalRatio: '6 / 6', lessonsCoverage: '100.0%', lessonsRatio: '6 / 6', recordsCount: 6, teachersRatio: '1 / 1', lessonsCount: 30, lessonsShare: '3.0%', evalsCount: 9, evalsShare: '6.1%', topTeacher: 'فيصل محمد مسلم الحضري' }},
  {{ department: 'الحاسوب', index: 65.13, evalCoverage: '70.6%', evalRatio: '12 / 17', lessonsCoverage: '100.0%', lessonsRatio: '17 / 17', recordsCount: 17, teachersRatio: '4 / 4', lessonsCount: 21, lessonsShare: '2.1%', evalsCount: 20, evalsShare: '13.6%', topTeacher: 'خالد عصام بارودي' }},
  {{ department: 'مختبر التصنيع الرقمي', index: 59.90, evalCoverage: '87.5%', evalRatio: '7 / 8', lessonsCoverage: '100.0%', lessonsRatio: '8 / 8', recordsCount: 8, teachersRatio: '2 / 2', lessonsCount: 17, lessonsShare: '1.7%', evalsCount: 16, evalsShare: '10.9%', topTeacher: 'اياد أحمد سلمان عبدالقادر' }},
  {{ department: 'STEM', index: 57.99, evalCoverage: '32.4%', evalRatio: '12 / 37', lessonsCoverage: '91.9%', lessonsRatio: '34 / 37', recordsCount: 37, teachersRatio: '12 / 17', lessonsCount: 120, lessonsShare: '11.9%', evalsCount: 24, evalsShare: '16.3%', topTeacher: 'عمران كاشف محمد حسين اسد' }},
  {{ department: 'اللغة الإنجليزية', index: 57.49, evalCoverage: '21.1%', evalRatio: '4 / 19', lessonsCoverage: '100.0%', lessonsRatio: '19 / 19', recordsCount: 19, teachersRatio: '3 / 4', lessonsCount: 203, lessonsShare: '20.2%', evalsCount: 4, evalsShare: '2.7%', topTeacher: 'محمد سيد ميردادي' }},
  {{ department: 'التصميم التكنولوجي', index: 43.11, evalCoverage: '45.8%', evalRatio: '11 / 24', lessonsCoverage: '58.3%', lessonsRatio: '14 / 24', recordsCount: 24, teachersRatio: '2 / 2', lessonsCount: 86, lessonsShare: '8.5%', evalsCount: 11, evalsShare: '7.5%', topTeacher: 'محمد شفاتا احمد / احمد المعاني' }},
  {{ department: 'الرياضيات', index: null, evalCoverage: '0.0%', evalRatio: '0 / 18', lessonsCoverage: '100.0%', lessonsRatio: '18 / 18', recordsCount: 18, teachersRatio: '6 / 6', lessonsCount: 60, lessonsShare: '6.0%', evalsCount: 0, evalsShare: '0.0%', topTeacher: 'جعفر ياشلي / عبدالغني عبيده' }},
  {{ department: 'التربية البدنية', index: null, evalCoverage: '0.0%', evalRatio: '0 / 19', lessonsCoverage: '0.0%', lessonsRatio: '0 / 19', recordsCount: 19, teachersRatio: '3 / 3', lessonsCount: 0, lessonsShare: '0.0%', evalsCount: 0, evalsShare: '0.0%', topTeacher: 'طاهر الحلو / فتحي بلحاج' }},
  {{ department: 'مختبر الروبوت', index: null, evalCoverage: 'غير متاح', evalRatio: '0 / 0', lessonsCoverage: 'غير متاح', lessonsRatio: '0 / 0', recordsCount: 0, teachersRatio: '0 / 2', lessonsCount: 0, lessonsShare: '0.0%', evalsCount: 0, evalsShare: '0.0%', topTeacher: 'اياد سالمه / محمود اقبال' }},
];

export const ADMINISTRATIVE_RATINGS_LIST = [
  // 7 ممتاز للمهندسين والمختبرات
  {{ name: 'ابراهيم عونى عمر حسن النعيمى', department: 'مختبر الطاقة', rating: 'ممتاز', basis: 'تقدير إداري للمهندسين والمختبرات التخصصية', hasActivity: false }},
  {{ name: 'انس عبدالكريم موسى جرادات', department: 'مختبر الطاقة', rating: 'ممتاز', basis: 'تقدير إداري للمهندسين والمختبرات التخصصية', hasActivity: true }},
  {{ name: 'اياد أحمد سلمان عبدالقادر', department: 'مختبر التصنيع الرقمي', rating: 'ممتاز', basis: 'تقدير إداري للمهندسين والمختبرات التخصصية', hasActivity: true }},
  {{ name: 'اياد محمود علي سالمه', department: 'مختبر الروبوت', rating: 'ممتاز', basis: 'تقدير إداري للمهندسين والمختبرات التخصصية', hasActivity: false }},
  {{ name: 'عبدالعزيز محمد', department: 'المختبرات التخصصية', rating: 'ممتاز', basis: 'تقدير إداري للمهندسين والمختبرات التخصصية', hasActivity: true }},
  {{ name: 'على سالم على سالمين الصيعري', department: 'مختبر التصنيع الرقمي', rating: 'ممتاز', basis: 'تقدير إداري للمهندسين والمختبرات التخصصية', hasActivity: true }},
  {{ name: 'محمود علم اقبال احمد', department: 'مختبر الروبوت', rating: 'ممتاز', basis: 'تقدير إداري للمهندسين والمختبرات التخصصية', hasActivity: false }},

  // 21 جيد جداً
  {{ name: 'احمد اسامه صقر المعاني', department: 'التصميم التكنولوجي', rating: 'جيد جداً', basis: 'تقدير إداري لمعلمي مادة التصميم التكنولوجي وفق اعتماد الإدارة', hasActivity: true }},
  {{ name: 'محمد شفاتا احمد', department: 'التصميم التكنولوجي', rating: 'جيد جداً', basis: 'تقدير إداري لمعلمي مادة التصميم التكنولوجي وفق اعتماد الإدارة', hasActivity: true }},
  {{ name: 'اوزدن اوزغور', department: 'STEM', rating: 'جيد جداً', basis: 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة', hasActivity: false }},
  {{ name: 'ايلفيس ايلوم تيتي', department: 'اللغة الإنجليزية', rating: 'جيد جداً', basis: 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة', hasActivity: false }},
  {{ name: 'زايد كاظم', department: 'STEM', rating: 'جيد جداً', basis: 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة', hasActivity: false }},
  {{ name: 'سليمان ميا', department: 'STEM', rating: 'جيد جداً', basis: 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة', hasActivity: false }},
  {{ name: 'فوزي عصام بو فخرالدين', department: 'STEM', rating: 'جيد جداً', basis: 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة', hasActivity: false }},
  {{ name: 'نبيل صالح الدين عطيه ايوب', department: 'STEM', rating: 'جيد جداً', basis: 'تقدير إداري للمعلمين ضمن النطاق دون بيانات نشاط متاحة', hasActivity: false }},
  {{ name: 'حجيباهلل خاسييف', department: 'STEM', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'زكي أحمد خالد', department: 'STEM', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'زوكير عبدالرحمانوف', department: 'STEM', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'سيد علي هايدور', department: 'STEM', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'شاكيل احمد رفيق', department: 'STEM', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'طاهر كمال عبدهللا الحلو', department: 'التربية البدنية', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'عبدالغني عبيده', department: 'الرياضيات', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'عالء حسني محمد موسى', department: 'التربية الإسلامية', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'كريم ولجي', department: 'STEM', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'محمد كمال محمد زيد', department: 'الرياضيات', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'ناصر احمد حسن حلوة', department: 'التربية الإسلامية', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'نزار بن عبدهللا حاجي', department: 'STEM', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
  {{ name: 'هشام محمد امام سليمان', department: 'اللغة العربية', rating: 'جيد جداً', basis: 'حد أدنى إداري لمعلمي الصف الثاني عشر لاستخدام منصات تعليمية أخرى، وفق إفادة الإدارة', hasActivity: true }},
];

export const EXCLUDED_COORDINATORS_LIST = [
  {{ name: 'احمد عادل عبده طبيشات', department: 'التعليم الإلكتروني', role: 'منسق المشاريع الالكترونية', reason: 'منسق مشاريع' }},
  {{ name: 'احمد عقله فارس فارس', department: 'STEM', role: 'منسق STEM', reason: 'منسق قسم' }},
  {{ name: 'اسعد محمود ناعس', department: 'اللغة العربية', role: 'منسق اللغة العربية', reason: 'منسق قسم' }},
  {{ name: 'جاد مصطفى العيتاني', department: 'البحث العلمي', role: 'اخصائي البحث العلمي', reason: 'أخصائي بحث علمي' }},
  {{ name: 'روي جورج مخول', department: 'الحاسوب', role: 'منسق الحاسوب', reason: 'منسق قسم' }},
  {{ name: 'ماهر عيسى حسن علوان', department: 'التربية الإسلامية', role: 'منسق الدراسات الاسلامية', reason: 'منسق قسم' }},
  {{ name: 'محمد عمر محمد سلامة', department: 'اللغة الإنجليزية', role: 'منسق اللغة الانجليزية', reason: 'منسق قسم' }},
  {{ name: 'يامن فايز فرح', department: 'الرياضيات', role: 'منسق الرياضيات', reason: 'منسق قسم' }},
  {{ name: 'يوسف محمد دحمان', department: 'التربية البدنية', role: 'منسق التربية البدنية', reason: 'منسق قسم' }},
];

export const SEPTEMBER_2026_LMS_TEACHERS: LmsReportTeacherRecord[] = {json.dumps(teachers, ensure_ascii=False, indent=2)};

export const TOP_OVERALL_TEACHERS = SEPTEMBER_2026_LMS_TEACHERS.filter(t => t.category === 'top_overall' || (t.generalIndex && t.generalIndex >= 80));
export const TOP_DEPT_TEACHERS = SEPTEMBER_2026_LMS_TEACHERS.filter(t => t.category === 'top_dept' || t.bestInDept);
export const TOP_LESSONS_TEACHERS = [...SEPTEMBER_2026_LMS_TEACHERS].filter(t => t.lessonsUploaded > 0).sort((a, b) => b.lessonsValid - a.lessonsValid).slice(0, 10);
export const TOP_GRADED_TEACHERS = [...SEPTEMBER_2026_LMS_TEACHERS].filter(t => t.submissionsReceived > 0).sort((a, b) => b.submissionsGraded - a.submissionsGraded).slice(0, 10);

export const FOLLOWUP_PENDING_TEACHERS = SEPTEMBER_2026_LMS_TEACHERS.filter(t => t.submissionsPending > 0).sort((a, b) => b.submissionsPending - a.submissionsPending);
export const FOLLOWUP_PARTIAL_TEACHERS = SEPTEMBER_2026_LMS_TEACHERS.filter(t => t.evalCoveragePercent > 0 && t.evalCoveragePercent < 100);
export const UNASSIGNED_EVAL_TEACHERS = SEPTEMBER_2026_LMS_TEACHERS.filter(t => t.evalUnassigned > 0);
export const ZERO_LESSON_TEACHERS = SEPTEMBER_2026_LMS_TEACHERS.filter(t => t.hasActivityData && t.lessonsUploaded === 0);
'''

with open('/Users/ahmadtubaishat/.gemini/antigravity/scratch/teacher-tracking/src/lib/lmsReportSeptember2026.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print('File written successfully!')
