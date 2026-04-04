import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
    return (
            <Link
                to="/"
                className="text-2xl font-display font-bold text-abugida-900 dark:text-white flex items-center"
            >
                <span className="bg-abugida-500 text-gray-100 h-8 w-8 rounded-lg flex items-center justify-center mr-2 shadow-lg">
                    A
                </span>
            Abugida
            </Link>
    );
}

export default Logo;
