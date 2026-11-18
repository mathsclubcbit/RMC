export const IPL_TEAMS_2026 = [
    {
        name: 'Chennai Super Kings',
        shortName: 'CSK',
        logo: '/assets/ipl/CSK.svg'
    },
    {
        name: 'Delhi Capitals',
        shortName: 'DC',
        logo: '/assets/ipl/DC.svg'
    },
    {
        name: 'Gujarat Titans',
        shortName: 'GT',
        logo: '/assets/ipl/GT.svg'
    },
    {
        name: 'Kolkata Knight Riders',
        shortName: 'KKR',
        logo: '/assets/ipl/KKR.svg'
    },
    {
        name: 'Lucknow Super Giants',
        shortName: 'LSG',
        logo: '/assets/ipl/LSG.svg'
    },
    {
        name: 'Mumbai Indians',
        shortName: 'MI',
        logo: '/assets/ipl/MI.svg'
    },
    {
        name: 'Punjab Kings',
        shortName: 'PBKS',
        logo: '/assets/ipl/PBKS.svg'
    },
    {
        name: 'Rajasthan Royals',
        shortName: 'RR',
        logo: '/assets/ipl/RR.svg'
    },
    {
        name: 'Royal Challengers Bengaluru',
        shortName: 'RCB',
        logo: '/assets/ipl/RCB.svg'
    },
    {
        name: 'Sunrisers Hyderabad',
        shortName: 'SRH',
        logo: '/assets/ipl/SRH.svg'
    }
];

export const getIplTeam = (teamName) => IPL_TEAMS_2026.find(team => team.name === teamName);
