import { MeasurementFrequency } from './queries';

/**
 * Matches a frequency to a particular pattern in the Treemap
 */
export function PatternMatcher(frequency: MeasurementFrequency) {
    switch (frequency.asn) {
        case 8075:
        case 8096:
            return 'url(#zwaa-microsoft)';
        case 14618:
        case 7224:
        case 16509:
        case 36263:
        case 10291:
            return 'url(#zwaa-amazon)';
        case 396982:
        case 139190:
        case 139070:
        case 15169:
        case 19527:
        case 36040:
        case 43515:
        case 16550:
            return 'url(#zwaa-google)';
        default:
            return (frequency.asn || frequency.category.length) % 2 === 0
                ? 'url(#zwaa-p1)'
                : 'url(#zwaa-p2)'
    }
}

export default function TreemapPatterns() {
    return (
        <defs>
            <pattern id="zwaa-p1" patternUnits="userSpaceOnUse" width="4" height="4">
                <path
                    d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
                    stroke="#0000FF"
                />
            </pattern>
            <pattern id="zwaa-p2" patternUnits="userSpaceOnUse" width="4" height="4">
                <path
                    d="M 3 -1 l 2 2 M -0 0 l 4 4 M -1 3 l 2 2"
                    stroke="#0000FF"
                />
            </pattern>
            <pattern id="zwaa-amazon" patternUnits="userSpaceOnUse" width="12" height="24">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.21768 5.33289L6.17226 4.89987L6.68081 3.67212L9.75017 4.94349L8.4788 8.01286L7.25105 7.50431L7.6148 6.62614C6.97725 6.94299 6.30975 7.10993 5.62598 7.10993C4.32741 7.10993 3.08751 6.50781 2 5.4203L2.93968 4.48062C3.84552 5.38646 4.76509 5.78102 5.62598 5.78102C6.14073 5.78102 6.67645 5.63996 7.21768 5.33289Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M0 19.4211V18.0842C0.398186 18.0316 0.806345 17.8942 1.21768 17.6608L0.172256 17.2277L0.680806 16L3.75017 17.2714L2.4788 20.3407L1.25105 19.8322L1.6148 18.954C1.09403 19.2128 0.553279 19.3716 0 19.4211Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 18.0842V19.4211C11.8759 19.4322 11.7512 19.4378 11.626 19.4378C10.3274 19.4378 9.08751 18.8357 8 17.7481L8.93968 16.8085C9.84552 17.7143 10.7651 18.1089 11.626 18.1089C11.7495 18.1089 11.8743 18.1007 12 18.0842Z" fill="#0000FF" />
            </pattern>
            <pattern id="zwaa-microsoft" patternUnits="userSpaceOnUse" width="12" height="12">
                <path fillRule="evenodd" clipRule="evenodd" d="M8.22211 4.22222L7.77756 3.77767L5.99989 2L4.22222 3.77767L3.77767 4.22222L2 5.99989L3.77783 7.77772L3.77767 7.77788L5.99989 10.0001L8.22211 7.77788L8.22195 7.77772L9.99978 5.99989L8.22211 4.22222ZM5.99989 2.88889L7.33312 4.22211L5.99989 5.55534L4.66667 4.22211L5.99989 2.88889ZM4.22211 4.66667L5.55534 5.99989L5.55545 6L4.22222 7.33322L2.88889 5.99989L4.22211 4.66667ZM7.77756 7.33322L6.44433 6L6.44444 5.99989L7.77767 4.66667L9.11089 5.99989L7.77756 7.33322ZM4.66656 7.77788L5.99989 6.44455L7.33322 7.77788L5.99989 9.11122L4.66656 7.77788Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M3.99989 0.00012207L3.111 0.000121993L3.11111 0.000231665L1.77789 1.33346L0.444662 0.000231432L0.444554 0.000123905L3.49691e-07 0.000121721L3.10808e-07 0.444893L0.000110222 0.444783L1.33334 1.77801L0.000109989 3.11123L7.77187e-08 3.11112L0 4.00001L0.000109911 4.00012L1.77778 2.22245L2.22233 1.7779L4 0.000231743L3.99989 0.00012207Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 3.99989L12 3.111L11.9999 3.11111L10.6667 1.77789L11.9999 0.444661L12 0.444554L12 -1.74846e-07L11.5552 -1.55404e-07L11.5553 0.000109756L10.2221 1.33333L8.88889 0.000109872L8.889 -3.88596e-08L8.00011 0L8 0.000109911L9.77767 1.77778L10.2222 2.22233L11.9999 4L12 3.99989Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M8.00011 12L8.889 12L8.88889 11.9999L10.2221 10.6667L11.5553 11.9999L11.5554 12L12 12L12 11.5552L11.9999 11.5553L10.6667 10.2221L11.9999 8.88889L12 8.889L12 8.00011L11.9999 8L10.2222 9.77767L9.77767 10.2222L8 11.9999L8.00011 12Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M0 8.00011L-3.88596e-08 8.889L0.000109634 8.88889L1.33333 10.2221L0.000109517 11.5553L1.99035e-06 11.5554L-1.74846e-07 12L0.444771 12L0.444661 11.9999L1.77789 10.6667L3.11111 11.9999L3.111 12L3.99989 12L4 11.9999L2.22233 10.2222L1.77778 9.77767L0.000109673 8L0 8.00011Z" fill="#0000FF" />
            </pattern>
            <pattern id="zwaa-google" patternUnits="userSpaceOnUse" width="12" height="24">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 18C8 20.2091 9.79086 22 12 22V20.6667C10.5272 20.6667 9.33333 19.4728 9.33333 18C9.33333 16.5272 10.5272 15.3333 12 15.3333V14C9.79086 14 8 15.7909 8 18Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M0 20.6667C1.24256 20.6667 2.28663 19.8168 2.58266 18.6667H0V17.3333H2.58266C2.28663 16.1832 1.24256 15.3333 0 15.3333V14C2.20914 14 4 15.7909 4 18C4 20.2091 2.20914 22 0 22V20.6667Z" fill="#0000FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M8.58266 6.66667C8.28663 7.81682 7.24256 8.66667 6 8.66667C4.52724 8.66667 3.33333 7.47276 3.33333 6C3.33333 4.52724 4.52724 3.33333 6 3.33333C7.24256 3.33333 8.28663 4.18318 8.58266 5.33333H6V6.66667H8.58266ZM10 6C10 8.20914 8.20914 10 6 10C3.79086 10 2 8.20914 2 6C2 3.79086 3.79086 2 6 2C8.20914 2 10 3.79086 10 6Z" fill="#0000FF" />
            </pattern>
        </defs>
    );
}