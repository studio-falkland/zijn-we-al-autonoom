import Link from 'next/link';

export default function Home() {
    return (
       <div className="p-8 flex flex-col">
            <Link className="underline text-blue-700" href="/mail">Mail</Link>
            <Link className="underline text-blue-700" href="/webserver">Webserver</Link>
       </div>
    );
}
