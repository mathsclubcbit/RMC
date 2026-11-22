import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import QuestionsClient from './QuestionsClient';

export const metadata = { title: 'MPL Question Bank | RMC' };

export default async function MplQuestionBankPage() {
    const cookieStore = await cookies();
    if (cookieStore.get('mpl_admin_auth')?.value !== 'true') redirect('/mpl/admin');
    return <QuestionsClient />;
}
