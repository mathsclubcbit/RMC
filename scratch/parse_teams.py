import os
import re
import json

raw_text = """
SRH A SRH B
Names Contact Names Contact
Thakshith Khanna 9030812075 Sagar Rathod 6281486771
Challa Chaitanya 7989976299 Togiti Rohit 8008300323
 Peddaiavalla Vikas Reddy 9392730165 Riyasath Ali 9398298603
Sri Ranganath Ravinuthula 9989418395 punith raj 9010110061
Kethavath Charan 6304115773 Mokshith Reddy 9347619049
Shiva Sai Basaboina 8019990514 Murtaza Mir 6006050811
Maniteja Karre 7569985018 Vivek Ch 7396911982
Sai charan reddy Malluri 7842214900 Siddiq SK 9963765182
Sanjay Sayam 7396221075 Sathwik Thummala 9390227758
Vishwas Yeleshwaram 9392360632 Hrishekesh 9059687100
SRH C SRH D
Names Contact Names Contact
Maryam Aqeel 7993964231 Aditya Kumar 7722008228
Dhana Shree 8179222798 Shraddha Jeripothula 9177953001
Pathuri Nichitha 7989319694 P Anish 6302820682
UMME HABEEBA 8500566004 Venkat karthik J 8328047871
MARYAM MOHAMMED ATIF 7032090756 Goshetti Sravan 9392533497
Aleena Fatima 9377908764 Rudhvik Bathini 88576934
 Abhinayasri gaddalaa 7671809904 TARRA KRISHNA CHAITANYA 9704461939
Rachakonda Pavani 6281375767 Banothu Sandhya 9948913260
Naisha Kanety 7396205747 Laxmi B H Mandula 8121750280
UzairAhmed 1447 8985438157 kandrathi harshaupani 9701978338
SRH E SRH F
Names Contact Names Contact
Jashwanth 9398203947 Ajmeera Swamy 9347125560
Laharika Rajarapu 8096336151 Gurram Jayanth Kumar 9063401643
Goli Sai teja 8106197658 Shiva Shankar goud C 7981549915
Mihir Dev 8074576766 Srikar Manthena 6304591982
Hunter Gamerz 7075293619 Bolgam Keerthana 7569885767
Katta Eshwar 9505508434 Mohammed Mohid Pasha 8309001141
Sriharsha Konda 9912060099 Sudireddy Uhith 6303742907
JASHWANTH GUNIGANTI 957384031 Devansh Makam 9652203699
Gautham Agnivesh 919392003395 Rahul Boini 9281244887
surya teja 7008358196 Aanchal Kabra 9392000245
SRH G SRH H
Names Contact Names Contact
MAHATHI REDDY CHINTHALA 7013703128 Vasudevula Lokesh Reddy 7416776242
V Nithin Sekhar 9281414169 Sathwik 6304963185
Rakeshchary Kammari 8522068135 Asampally Rufus 7032870021
Yagna Karthik 9392234298 Vedhanth Reddy 9391450338
Sindhura Regunta 9100846122 G. Bhupendra 9154695073
Pallavi Bhooma 9398502642 Nishindra Reddy 9381362032
Bhargavi Reddy 9030682246 Anyonya Sappidi 9347890134
Ankitha Adusupalli 8885427057 Preethisree Palla 7981070162
Bashipaka Bunny 8019760756 Ravali Chamanthi 9014615907
Mouli 9398926637 Indu Priya 9014924695
RCB A RCB B
Names Contact Names Contact
Shaik Tabrez 8247400170 Aneesh Krishna garre 9391110843
MANSOOR KHAN 9550971156 P MUKESH REDDY 7569714569
Chepuri Rajukumar 9391443973 C Siva Varshitha Reddy 6301862004
sandeep padamatinti 7730028128 K Mariya Raj 7386698252
Hanith Ganduri 7675082446 B Navadeep 9515499075
Raju 9347891867 SRI CHARAN YADAV BIKANI 7893857542
Abhi 7816072407 Kushal reddy Gade 8978044953
Ajay chepuri 9059958696 Adi 9182704236
raghu Yadav 8008978103 vishnu vardhan 9182704236
Akshay Sharma 7297961547 Sanjay 7569898105
RCB C RCB D
Names Contact Names Contact
 Bachuwar Vishwas 8985261751 SAI SAMEEKSHA GUNTUPALLI 9182534433
Rohit Kotti 6302098485 Snehitha Suryadevara 6281466619
Ganesh Nayak Ramavath 9441337474 Sanvi Reddy 9121666980
Siddhartha Boga 9490409458 Akshara veeraswamy 7675818805
Sai Pranith Reddy 9100044078 Deepika panjala 6300537351
Gaurav Deshpande 9646359247 Tanishq Hardayal 9541388363
CHUKKA NISHANTH 9393359875 Beemer Shravani 8519841112
Akhil Karthik Sriramoju 7780197908 Koushik 8977861869
GONURU YASHWANTH 9346557362 Srilatha Siramdas 9121449135
Gilla Abhiram 8885169613 Ritvik ram 9441409320
RCB E MI A
Names Contact Names Contact
T.sai rishitha 8688803604 Navaja Rani 8919877194
Bhanu Kare 8074444961 Saanvi Ponagoti 8374858822
Akshaya B 7302424396 Chanuvally Srinidhi 9063954721
Siri Ragi 8985066799 gayathreyini darishetty 6303405792
Akshaya Kadam 8367609314 Hari vamshitha Bampelly 6281583604
Tejashwini Dasarla 7386637048 Krithika Ragila 6302841561
Amlan Jyoti Prakash Gahan 7749992033 hindhumathi Gugulothu 9392558402
P MUKESH REDDY 7569714569 Ruthika Reddy 8008130983
Mohd Haseeb Uddin 6304157305 Sravani Nampally 7382571954
Shashwath Kumar Jorrigala 7013377329 Nomitha Reddy 9666554546
MI B MI C
Names Contact Names Contact
nikitha azeemra 7995827269 Shivasai Chindam 9618464307
Sanjana Ivalapangu 9392609175 Matam Shekar 6301200273
VALUGONDA SUJALA 8466953470 Saketh Madharapu 6281532989
Vempati Vamshitha 8341575966 Krishna Chaitanya Surao 9182114411
Pravalika Megavath 9390815594 Babji Tata 9848381612
Tejasri Galeti 9392763678 Srujan.g 9701520911
Ritvik ram 9441409320 G. Sushanth 7386979486
goli prachethreddy 9391264221 S. Manu 8886844044
Sahasra 9490997088 Harshith 9182762332
Gade Sai teja 6300406343 R. Sanjay 6304827312
CSK A CSK B
Names Contact Names Contact
Bhukya Rahul 6302317783 Vyshnavi goka 8374238033
Emurla Vishnuvardhan 7893964578 Harika A 9032236331
suman thangidi 9701892172 Sathvika Sammeta 7569582738
PANTHANGI VENKATA KAILASH 6301125877 Sathwika Saya 9133649815
Aravind Bhupathi 8143677610 Vadala Shravya 6300153779
Vishnu Vardhan 7672088272 Sarika Vutla 8328596300
sushanthreddyk2007 9963913636 Kurella Lahari Priya 7032067353
Vikas Juloori 9000834948 Harshitha Maddikatla 9392300971
Ginjala varshith Reddy 7680860052 Sravanthi Gugulothu 9182936926
Banoth Jeethendra 7989649745 Devarshini Malepati 9182699689
RR KKR
Name Contact Names Contact
Sri Charan 9381942836 Bhageerath rama 9291547323
Abhinay M 9398547393 PENTAM YASHWANTH 8555877572
pranav raj 8184998915 Karthik Cheruku 6301044657
nitya k 9618815858 Akkapeddi sreekar Revanth 9666099668
sahasra ch 8106456122 Sanjay Anthati 7780219209
Mattipalli Anjali 8309429087 Jadhav Sanjay 9553382136
B. Thulasi 9030083604 SAHITHI JARUPULA 6301649726
 haneesh m 9032519421 M.roshini 6281486433
Prinsi Potharaju 8309470200 Tarun Perumalla 8333960250
Venu Kadupolla 9347034079 T Ananya 7674980204
GT
Names Contact
Ishan Rajurkar 8106460239
Chinmay shah 9948006099
DHANESH KOTTUR 6281155021
Mohak Dugar 8247032206
Sonu Prajapati 7794875392
Priyal Panchariya 7207586839
Neeharika H Vasuki 7702577455
Shashank Avadootha 8121273400
macha vaishnavi 9908654478
Kanduri sravani 7013928902
"""

os.makedirs(r'c:\RMC\teams', exist_ok=True)

teams = {}

lines = raw_text.strip().split('\n')
current_team1 = None
current_team2 = None
is_single_column = False

def is_team_header(line):
    return any(t in line for t in ['SRH', 'RCB', 'MI', 'CSK', 'RR', 'KKR', 'GT']) and 'Names' not in line

for i, line in enumerate(lines):
    line = line.strip()
    if not line: continue
    
    if is_team_header(line):
        parts = line.split('  ')
        if len(parts) == 1:
            parts = [p.strip() for p in line.split() if p.strip()]
            
            if len(parts) >= 4 and parts[1] in ['A','B','C','D','E','F','G','H'] and parts[3] in ['A','B','C','D','E','F','G','H']:
                current_team1 = f'{parts[0]} {parts[1]}'
                current_team2 = f'{parts[2]} {parts[3]}'
                teams[current_team1] = []
                teams[current_team2] = []
                is_single_column = False
            elif len(parts) == 4 and parts[0] == 'RCB' and parts[1] == 'E' and parts[2] == 'MI' and parts[3] == 'A':
                current_team1 = 'RCB E'
                current_team2 = 'MI A'
                teams[current_team1] = []
                teams[current_team2] = []
                is_single_column = False
            elif len(parts) == 2 and parts[0] in ['RR'] and parts[1] in ['KKR']:
                current_team1 = 'RR'
                current_team2 = 'KKR'
                teams[current_team1] = []
                teams[current_team2] = []
                is_single_column = False
            elif len(parts) == 2 and parts[1] in ['A','B','C','D','E','F','G','H']:
                current_team1 = f'{parts[0]} {parts[1]}'
                current_team2 = None
                teams[current_team1] = []
                is_single_column = True
            elif len(parts) == 1 and parts[0] == 'GT':
                current_team1 = 'GT'
                current_team2 = None
                teams[current_team1] = []
                is_single_column = True
        continue
        
    if 'Names' in line and 'Contact' in line:
        continue
        
    # Using regex to find numbers which denote contacts
    matches = list(re.finditer(r'\b\d{8,12}\b', line))
    if len(matches) == 2 and not is_single_column:
        m1, m2 = matches
        
        name1 = line[:m1.start()].strip()
        contact1 = m1.group()
        
        name2 = line[m1.end():m2.start()].strip()
        contact2 = m2.group()
        
        if current_team1: teams[current_team1].append({'name': name1, 'contact': contact1})
        if current_team2: teams[current_team2].append({'name': name2, 'contact': contact2})
        
    elif len(matches) == 1:
        m = matches[0]
        name = line[:m.start()].strip()
        contact = m.group()
        
        if current_team1: teams[current_team1].append({'name': name, 'contact': contact})

for tname, members in teams.items():
    safe_name = tname.replace(' ', '_').upper()
    with open(f'c:\\RMC\\teams\\{safe_name}.json', 'w') as f:
        json.dump({'teamName': tname, 'players': members}, f, indent=2)
    print(f'Created {safe_name}.json with {len(members)} players')
