<?php

namespace App\Enums;

enum UserRole: string 
{
    case USER = 'user';
    case SUPPORT = 'support';
    case ADMIN = 'admin';
}
